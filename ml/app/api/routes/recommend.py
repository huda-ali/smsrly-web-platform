import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.property import (
    RecommendationResponse, RecommendationItem, PropertyResponse,
    SimilarPropertyResponse, InteractionCreate, InteractionResponse,
    UserCreate, UserResponse, UserPreferences,
    TrainRequest, TrainResponse,
)
from services.property_service import property_service
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Recommendations"])


@router.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_recommendations(
    user_id: uuid.UUID,
    top_n: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    results = await property_service.get_recommendations(db, user_id, top_n=top_n)
    items = [
        RecommendationItem(
            property=PropertyResponse.model_validate(prop),
            score=round(score, 4),
            reason=reason,
        )
        for prop, score, reason in results
    ]
    strategy = items[0].reason if items else "hybrid"
    return RecommendationResponse(
        user_id=user_id,
        recommendations=items,
        strategy=strategy,
        generated_at=datetime.utcnow(),
    )


@router.get("/similar-properties/{property_id}", response_model=SimilarPropertyResponse)
async def get_similar_properties(
    property_id: uuid.UUID,
    top_n: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    results = await property_service.get_similar_properties(db, property_id, top_n=top_n)
    items = [
        RecommendationItem(
            property=PropertyResponse.model_validate(prop),
            score=round(score, 4),
            reason=reason,
        )
        for prop, score, reason in results
    ]
    return SimilarPropertyResponse(
        property_id=property_id,
        similar_properties=items,
        generated_at=datetime.utcnow(),
    )


@router.post("/interact", response_model=InteractionResponse, status_code=201)
async def record_interaction(
    data: InteractionCreate,
    db: AsyncSession = Depends(get_db),
):
    await property_service.get_or_create_user(db, data.user_id)
    prop = await property_service.get_property(db, data.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    interaction = await property_service.record_interaction(db, data)
    return InteractionResponse.model_validate(interaction)


@router.post("/user/preferences", response_model=UserResponse)
async def update_user_preferences(
    user_id: uuid.UUID,
    preferences: UserPreferences,
    db: AsyncSession = Depends(get_db),
):
    user = await property_service.update_user_preferences(db, user_id, preferences)
    if not user:
        # Create user with preferences
        user_data = UserCreate(preferences=preferences)
        user = await property_service.create_user(db, user_data)
    return UserResponse.model_validate(user)


@router.post("/train-model", response_model=TrainResponse)
async def train_model(
    request: TrainRequest,
    db: AsyncSession = Depends(get_db),
):
    from services.workers.celery_app import retrain_models
    task = retrain_models.apply_async(queue="ml")
    return TrainResponse(
        task_id=task.id,
        model_type=request.model_type,
        status="queued",
        message=f"Model training task queued with ID {task.id}",
    )
