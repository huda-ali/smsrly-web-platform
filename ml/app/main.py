import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.db.session import init_db, close_db
from app.schemas.property import HealthResponse

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info(f"Starting {settings.APP_NAME} [{settings.APP_ENV}]")
    os.makedirs(settings.MODEL_DIR, exist_ok=True)

    # Init DB tables (Alembic handles migrations in prod; this covers dev/test)
    try:
        await init_db()
    except Exception as e:
        logger.warning(f"DB init warning: {e}")

    # Pre-load ML models
    try:
        from services.recommendation.engine import recommendation_engine
        logger.info("Recommendation engine loaded.")
    except Exception as e:
        logger.warning(f"Could not pre-load recommendation engine: {e}")

    yield

    await close_db()
    logger.info("Application shut down.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="Enterprise-grade AI-powered real estate recommendation system",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routes
    from app.api.routes.properties import router as properties_router
    from app.api.routes.recommend import router as recommend_router
    from app.api.routes.scraping import router as scraping_router

    app.include_router(properties_router, prefix=settings.API_V1_STR)
    app.include_router(recommend_router, prefix=settings.API_V1_STR)
    app.include_router(scraping_router, prefix=settings.API_V1_STR)

    @app.get("/health", response_model=HealthResponse, tags=["Health"])
    async def health_check():
        db_status = "ok"
        redis_status = "ok"

        try:
            from app.db.session import engine
            async with engine.connect() as conn:
                await conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        except Exception as e:
            db_status = f"error: {e}"

        try:
            r = aioredis.from_url(settings.REDIS_URL)
            await r.ping()
            await r.aclose()
        except Exception as e:
            redis_status = f"error: {e}"

        overall = "healthy" if db_status == "ok" and redis_status == "ok" else "degraded"
        return HealthResponse(
            status=overall,
            version="1.0.0",
            environment=settings.APP_ENV,
            database=db_status,
            redis=redis_status,
        )

    return app


app = create_app()
