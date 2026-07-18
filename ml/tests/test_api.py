"""
Integration and unit tests for the Real Estate AI API.
Uses SQLite (via aiosqlite) to override the PostgreSQL DB for testing.
"""
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.session import Base, get_db
from app.db import models  # noqa: F401

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DB_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        # SQLite doesn't support all PG types; use a simplified approach
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ─────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data


# ─────────────────────────────────────────────────────────
# Properties CRUD
# ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_create_property(client: AsyncClient):
    payload = {
        "title": "Luxury Villa in Cairo",
        "description": "Stunning 5-bed villa with pool and garden.",
        "price": 1500000.0,
        "currency": "USD",
        "city": "Cairo",
        "country": "Egypt",
        "bedrooms": 5,
        "bathrooms": 4,
        "area": 450.0,
        "property_type": "villa",
        "amenities": ["pool", "garden", "parking", "security"],
        "images": ["https://example.com/img1.jpg"],
    }
    response = await client.post("/api/v1/properties", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["city"] == "Cairo"
    assert "id" in data
    return data["id"]


@pytest.mark.asyncio
async def test_list_properties(client: AsyncClient):
    response = await client.get("/api/v1/properties")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_get_property_not_found(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/properties/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_property_full_lifecycle(client: AsyncClient):
    # Create
    payload = {
        "title": "Test Apartment",
        "price": 200000.0,
        "city": "Alexandria",
        "country": "Egypt",
        "bedrooms": 2,
        "bathrooms": 1,
        "area": 90.0,
        "property_type": "apartment",
    }
    create_resp = await client.post("/api/v1/properties", json=payload)
    assert create_resp.status_code == 201
    prop_id = create_resp.json()["id"]

    # Read
    get_resp = await client.get(f"/api/v1/properties/{prop_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == prop_id

    # Update
    patch_resp = await client.patch(
        f"/api/v1/properties/{prop_id}",
        json={"price": 250000.0, "is_featured": True},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["price"] == 250000.0

    # Delete
    del_resp = await client.delete(f"/api/v1/properties/{prop_id}")
    assert del_resp.status_code == 204

    # Confirm deleted
    get_again = await client.get(f"/api/v1/properties/{prop_id}")
    assert get_again.status_code == 404


@pytest.mark.asyncio
async def test_filter_properties_by_city(client: AsyncClient):
    # Seed a property
    await client.post("/api/v1/properties", json={
        "title": "City Filter Test",
        "city": "Unique_Test_City_XYZ",
        "country": "Egypt",
        "price": 100000,
        "property_type": "apartment",
    })
    response = await client.get("/api/v1/properties?city=Unique_Test_City_XYZ")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all("Unique_Test_City_XYZ" in item["city"] for item in data["items"])


@pytest.mark.asyncio
async def test_filter_properties_by_price_range(client: AsyncClient):
    response = await client.get("/api/v1/properties?min_price=50000&max_price=500000")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        if item["price"]:
            assert 50000 <= item["price"] <= 500000


# ─────────────────────────────────────────────────────────
# Interactions
# ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_record_interaction(client: AsyncClient):
    # Create a property first
    create_resp = await client.post("/api/v1/properties", json={
        "title": "Interaction Test Property",
        "city": "Cairo",
        "country": "Egypt",
        "price": 300000,
        "property_type": "house",
    })
    prop_id = create_resp.json()["id"]
    user_id = str(uuid.uuid4())

    resp = await client.post("/api/v1/interact", json={
        "user_id": user_id,
        "property_id": prop_id,
        "interaction_type": "view",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["interaction_type"] == "view"
    assert data["implicit_score"] == 1.0


@pytest.mark.asyncio
async def test_record_interaction_property_not_found(client: AsyncClient):
    resp = await client.post("/api/v1/interact", json={
        "user_id": str(uuid.uuid4()),
        "property_id": str(uuid.uuid4()),
        "interaction_type": "like",
    })
    assert resp.status_code == 404


# ─────────────────────────────────────────────────────────
# Recommendations
# ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_get_recommendations(client: AsyncClient):
    user_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/recommendations/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert "recommendations" in data
    assert isinstance(data["recommendations"], list)


@pytest.mark.asyncio
async def test_get_similar_properties(client: AsyncClient):
    # Create a property
    create_resp = await client.post("/api/v1/properties", json={
        "title": "Similar Test Property",
        "city": "Giza",
        "country": "Egypt",
        "price": 450000,
        "property_type": "apartment",
        "bedrooms": 3,
    })
    prop_id = create_resp.json()["id"]

    response = await client.get(f"/api/v1/similar-properties/{prop_id}")
    assert response.status_code == 200
    data = response.json()
    assert "property_id" in data
    assert "similar_properties" in data


# ─────────────────────────────────────────────────────────
# User preferences
# ─────────────────────────────────────────────────────────
@pytest.mark.asyncio
async def test_update_user_preferences(client: AsyncClient):
    user_id = str(uuid.uuid4())
    resp = await client.post(
        f"/api/v1/user/preferences?user_id={user_id}",
        json={
            "preferred_cities": ["Cairo", "Alexandria"],
            "min_price": 100000,
            "max_price": 1000000,
            "min_bedrooms": 2,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "Cairo" in data["preferred_cities"]
    assert data["min_price"] == 100000


# ─────────────────────────────────────────────────────────
# Data processor unit tests
# ─────────────────────────────────────────────────────────
def test_data_processor_feature_vector():
    from services.processing.data_processor import DataProcessor
    dp = DataProcessor()
    prop = {
        "price": 500000,
        "area": 200,
        "bedrooms": 3,
        "bathrooms": 2,
        "latitude": 30.0,
        "longitude": 31.0,
        "property_type": "apartment",
        "amenities": ["pool", "gym", "parking"],
    }
    vector = dp.build_feature_vector(prop)
    assert isinstance(vector, list)
    assert len(vector) > 0
    assert vector[0] == 500000  # price
    assert vector[2] == 3.0    # bedrooms


def test_data_processor_clean_price():
    from services.processing.data_processor import DataProcessor
    dp = DataProcessor()
    assert dp.clean_price("$1,500,000") == 1500000.0
    assert dp.clean_price(250000) == 250000.0
    assert dp.clean_price(None) is None
    assert dp.clean_price("N/A") is None


def test_data_processor_encode_amenities():
    from services.processing.data_processor import DataProcessor
    dp = DataProcessor()
    encoded = dp.encode_amenities(["swimming pool", "gym", "parking lot"])
    assert encoded["pool"] == 1
    assert encoded["gym"] == 1
    assert encoded["parking"] == 1
    assert encoded["security"] == 0


def test_interaction_matrix_shape():
    from services.processing.data_processor import DataProcessor
    dp = DataProcessor()
    interactions = [
        {"user_id": "u1", "property_id": "p1", "interaction_type": "view", "rating": None},
        {"user_id": "u1", "property_id": "p2", "interaction_type": "like", "rating": None},
        {"user_id": "u2", "property_id": "p1", "interaction_type": "save", "rating": 4.0},
    ]
    matrix = dp.compute_interaction_matrix(interactions, ["u1", "u2"], ["p1", "p2"])
    assert matrix.shape == (2, 2)
    assert matrix[0][0] == 1.0  # u1 viewed p1
    assert matrix[0][1] == 3.0  # u1 liked p2
    assert matrix[1][0] == 4.0  # u2 rated p1


# ─────────────────────────────────────────────────────────
# Recommendation engine unit tests
# ─────────────────────────────────────────────────────────
def test_content_based_engine_similar():
    import numpy as np
    from services.recommendation.engine import ContentBasedEngine

    engine = ContentBasedEngine()
    ids = ["p1", "p2", "p3"]
    matrix = np.array([
        [1.0, 0.0, 0.0],
        [0.9, 0.1, 0.0],
        [0.0, 0.0, 1.0],
    ])
    engine.fit(ids, matrix)
    similar = engine.get_similar_properties("p1", top_n=2)
    assert len(similar) == 2
    assert similar[0][0] == "p2"  # p2 is most similar to p1


def test_hybrid_location_score():
    from services.recommendation.engine import HybridRecommendationEngine
    eng = HybridRecommendationEngine.__new__(HybridRecommendationEngine)
    # Same location = score 1.0
    score = eng._haversine_distance(30.0, 31.0, 30.0, 31.0)
    assert score == 0.0

    # Distance > 0
    score2 = eng._haversine_distance(30.0, 31.0, 31.0, 32.0)
    assert score2 > 0


def test_price_score():
    from services.recommendation.engine import HybridRecommendationEngine
    eng = HybridRecommendationEngine.__new__(HybridRecommendationEngine)

    # In range
    s = eng._price_score({"price": 300000}, 100000, 500000)
    assert s > 0.0

    # Below range
    s2 = eng._price_score({"price": 50000}, 100000, 500000)
    assert s2 == 0.0

    # Above range
    s3 = eng._price_score({"price": 600000}, 100000, 500000)
    assert s3 == 0.0

    # No bounds
    s4 = eng._price_score({"price": 999999}, None, None)
    assert s4 == 1.0
