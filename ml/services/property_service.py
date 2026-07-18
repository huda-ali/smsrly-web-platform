import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc, update
from sqlalchemy.orm import selectinload
import numpy as np

from app.db.models.property import Property, User, UserInteraction, ScrapeJob, InteractionType
from app.schemas.property import (
    PropertyCreate, PropertyUpdate, PropertySearchParams,
    UserCreate, UserPreferences, InteractionCreate,
)
from app.core.config import settings
from app.core.logging import get_logger
from services.processing.data_processor import data_processor
from services.recommendation.engine import recommendation_engine
from services.geocoding.geocoder import geocoder

logger = get_logger(__name__)

INTERACTION_IMPLICIT_SCORES = {
    "view": 1.0,
    "like": 3.0,
    "save": 4.0,
    "contact": 5.0,
    "share": 2.0,
    "dislike": -1.0,
}


class PropertyService:
    # -------------------------------------------------------------------------
    # Property CRUD
    # -------------------------------------------------------------------------
    async def create_property(self, db: AsyncSession, data: PropertyCreate) -> Property:
        prop_dict = data.model_dump()
        if prop_dict.get("price") and prop_dict.get("area") and prop_dict["area"] > 0:
            prop_dict["price_per_sqm"] = prop_dict["price"] / prop_dict["area"]

        # Geocode if no coordinates provided
        if not prop_dict.get("latitude") and prop_dict.get("address"):
            coords = await geocoder.geocode(
                f"{prop_dict['address']}, {prop_dict.get('city', '')}, {prop_dict.get('country', '')}"
            )
            if coords:
                prop_dict["latitude"], prop_dict["longitude"] = coords

        prop = Property(**prop_dict)
        db.add(prop)
        await db.flush()
        await db.refresh(prop)
        logger.info(f"Created property {prop.id}: {prop.title}")
        return prop

    async def get_property(self, db: AsyncSession, property_id: uuid.UUID) -> Optional[Property]:
        result = await db.execute(select(Property).where(Property.id == property_id))
        return result.scalar_one_or_none()

    async def update_property(
        self, db: AsyncSession, property_id: uuid.UUID, data: PropertyUpdate
    ) -> Optional[Property]:
        prop = await self.get_property(db, property_id)
        if not prop:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(prop, key, value)
        if prop.price and prop.area and prop.area > 0:
            prop.price_per_sqm = prop.price / prop.area
        await db.flush()
        await db.refresh(prop)
        return prop

    async def delete_property(self, db: AsyncSession, property_id: uuid.UUID) -> bool:
        prop = await self.get_property(db, property_id)
        if not prop:
            return False
        await db.delete(prop)
        return True

    async def list_properties(
        self, db: AsyncSession, params: PropertySearchParams
    ) -> Tuple[List[Property], int]:
        filters = [Property.is_active == True]

        if params.city:
            filters.append(Property.city.ilike(f"%{params.city}%"))
        if params.country:
            filters.append(Property.country.ilike(f"%{params.country}%"))
        if params.property_type:
            filters.append(Property.property_type == params.property_type)
        if params.min_price is not None:
            filters.append(Property.price >= params.min_price)
        if params.max_price is not None:
            filters.append(Property.price <= params.max_price)
        if params.min_bedrooms is not None:
            filters.append(Property.bedrooms >= params.min_bedrooms)
        if params.max_bedrooms is not None:
            filters.append(Property.bedrooms <= params.max_bedrooms)
        if params.min_area is not None:
            filters.append(Property.area >= params.min_area)
        if params.max_area is not None:
            filters.append(Property.area <= params.max_area)

        # Count
        count_stmt = select(func.count()).select_from(Property).where(and_(*filters))
        total = (await db.execute(count_stmt)).scalar_one()

        # Sort
        sort_col = getattr(Property, params.sort_by, Property.created_at)
        order_fn = desc if params.sort_order == "desc" else asc

        offset = (params.page - 1) * params.page_size
        stmt = (
            select(Property)
            .where(and_(*filters))
            .order_by(order_fn(sort_col))
            .offset(offset)
            .limit(params.page_size)
        )
        result = await db.execute(stmt)
        items = list(result.scalars().all())
        return items, total

    async def bulk_create_properties(
        self, db: AsyncSession, props_data: List[Dict[str, Any]]
    ) -> Tuple[int, int]:
        saved = 0
        skipped = 0
        for pdata in props_data:
            listing_url = pdata.get("listing_url")
            if listing_url:
                existing = await db.execute(
                    select(Property).where(Property.listing_url == listing_url)
                )
                if existing.scalar_one_or_none():
                    skipped += 1
                    continue
            try:
                prop = Property(**{k: v for k, v in pdata.items() if hasattr(Property, k)})
                if prop.price and prop.area and prop.area > 0:
                    prop.price_per_sqm = prop.price / prop.area
                db.add(prop)
                saved += 1
            except Exception as e:
                logger.warning(f"Could not save property '{pdata.get('title')}': {e}")
                skipped += 1

        await db.flush()
        return saved, skipped

    # -------------------------------------------------------------------------
    # User management
    # -------------------------------------------------------------------------
    async def create_user(self, db: AsyncSession, data: UserCreate) -> User:
        user_dict: Dict[str, Any] = {}
        if data.email:
            user_dict["email"] = data.email
        if data.preferences:
            prefs = data.preferences.model_dump(exclude_none=True)
            user_dict.update(prefs)
        user = User(**user_dict)
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user

    async def get_user(self, db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_or_create_user(self, db: AsyncSession, user_id: uuid.UUID) -> User:
        user = await self.get_user(db, user_id)
        if not user:
            user = User(id=user_id)
            db.add(user)
            await db.flush()
            await db.refresh(user)
        return user

    async def update_user_preferences(
        self, db: AsyncSession, user_id: uuid.UUID, prefs: UserPreferences
    ) -> Optional[User]:
        user = await self.get_user(db, user_id)
        if not user:
            return None
        prefs_dict = prefs.model_dump(exclude_unset=True)
        for key, value in prefs_dict.items():
            setattr(user, key, value)
        await db.flush()
        await db.refresh(user)
        return user

    # -------------------------------------------------------------------------
    # Interactions
    # -------------------------------------------------------------------------
    async def record_interaction(
        self, db: AsyncSession, data: InteractionCreate
    ) -> UserInteraction:
        implicit_score = INTERACTION_IMPLICIT_SCORES.get(data.interaction_type, 1.0)
        interaction = UserInteraction(
            user_id=data.user_id,
            property_id=data.property_id,
            interaction_type=data.interaction_type,
            rating=data.rating,
            implicit_score=implicit_score,
        )
        db.add(interaction)
        await db.flush()
        await db.refresh(interaction)
        return interaction

    async def get_user_interactions(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> List[UserInteraction]:
        result = await db.execute(
            select(UserInteraction).where(UserInteraction.user_id == user_id)
        )
        return list(result.scalars().all())

    # -------------------------------------------------------------------------
    # Recommendations
    # -------------------------------------------------------------------------
    async def get_recommendations(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        top_n: int = 10,
    ) -> List[Tuple[Property, float, str]]:
        user = await self.get_or_create_user(db, user_id)
        interactions = await self.get_user_interactions(db, user_id)
        interacted_ids = [str(ix.property_id) for ix in interactions]

        # Load all active properties
        result = await db.execute(select(Property).where(Property.is_active == True))
        all_properties = list(result.scalars().all())

        props_dicts = [data_processor.property_to_dict(p) for p in all_properties]

        user_preferences = {
            "min_price": user.min_price,
            "max_price": user.max_price,
            "preference_vector": user.preference_vector,
        }

        recs = recommendation_engine.recommend_for_user(
            user_id=str(user_id),
            properties=props_dicts,
            user_preferences=user_preferences,
            top_n=top_n,
            interacted_ids=interacted_ids,
        )

        prop_map = {str(p.id): p for p in all_properties}
        results = []
        for pid, score, reason in recs:
            prop = prop_map.get(pid)
            if prop:
                results.append((prop, score, reason))
        return results

    async def get_similar_properties(
        self,
        db: AsyncSession,
        property_id: uuid.UUID,
        top_n: int = 10,
    ) -> List[Tuple[Property, float, str]]:
        similar = recommendation_engine.similar_properties(
            property_id=str(property_id),
            top_n=top_n,
        )

        if not similar:
            # Fallback: same city / type
            source = await self.get_property(db, property_id)
            if not source:
                return []
            filters = [Property.is_active == True, Property.id != property_id]
            if source.city:
                filters.append(Property.city == source.city)
            result = await db.execute(
                select(Property).where(and_(*filters)).limit(top_n)
            )
            props = list(result.scalars().all())
            return [(p, 0.5, "same-location") for p in props]

        ids = [uuid.UUID(pid) for pid, _, _ in similar]
        result = await db.execute(select(Property).where(Property.id.in_(ids)))
        prop_map = {str(p.id): p for p in result.scalars().all()}

        return [
            (prop_map[pid], score, reason)
            for pid, score, reason in similar
            if pid in prop_map
        ]

    # -------------------------------------------------------------------------
    # Scrape jobs
    # -------------------------------------------------------------------------
    async def create_scrape_job(
        self, db: AsyncSession, site_name: str, target_url: str
    ) -> ScrapeJob:
        job = ScrapeJob(site_name=site_name, target_url=target_url)
        db.add(job)
        await db.flush()
        await db.refresh(job)
        return job

    async def get_scrape_job(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> Optional[ScrapeJob]:
        result = await db.execute(select(ScrapeJob).where(ScrapeJob.id == job_id))
        return result.scalar_one_or_none()

    async def update_scrape_job(
        self, db: AsyncSession, job_id: uuid.UUID, **kwargs
    ) -> Optional[ScrapeJob]:
        job = await self.get_scrape_job(db, job_id)
        if not job:
            return None
        for k, v in kwargs.items():
            setattr(job, k, v)
        await db.flush()
        await db.refresh(job)
        return job

    # -------------------------------------------------------------------------
    # ML Training
    # -------------------------------------------------------------------------
    async def train_models(self, db: AsyncSession) -> Dict[str, Any]:
        logger.info("Starting model training pipeline...")

        result = await db.execute(select(Property).where(Property.is_active == True))
        properties = list(result.scalars().all())

        if not properties:
            return {"status": "skipped", "reason": "No properties found"}

        props_dicts = [data_processor.property_to_dict(p) for p in properties]
        property_ids = [str(p.id) for p in properties]
        feature_matrix = data_processor.fit_transform(props_dicts)
        data_processor.save_artifacts()

        # Save feature vectors back to DB
        for i, prop in enumerate(properties):
            prop.feature_vector = feature_matrix[i].tolist()

        # Load interactions
        ix_result = await db.execute(select(UserInteraction))
        interactions = ix_result.scalars().all()

        user_ids = list(set(str(ix.user_id) for ix in interactions))

        ix_dicts = [
            {
                "user_id": str(ix.user_id),
                "property_id": str(ix.property_id),
                "interaction_type": ix.interaction_type,
                "rating": ix.rating,
            }
            for ix in interactions
        ]

        interaction_matrix = data_processor.compute_interaction_matrix(ix_dicts, user_ids, property_ids)

        recommendation_engine.train(
            properties=props_dicts,
            feature_matrix=feature_matrix,
            interactions=ix_dicts,
            user_ids=user_ids,
            property_ids=property_ids,
            interaction_matrix=interaction_matrix,
        )

        # Update user preference vectors from interaction history
        for uid in user_ids:
            u_uuid = uuid.UUID(uid)
            user = await self.get_user(db, u_uuid)
            if user:
                user_factor = recommendation_engine.cf_engine.get_user_factor(uid)
                if user_factor is not None:
                    user.preference_vector = user_factor.tolist()

        await db.flush()
        logger.info(f"Training complete: {len(properties)} properties, {len(user_ids)} users.")
        return {
            "status": "success",
            "properties_processed": len(properties),
            "users_processed": len(user_ids),
            "interactions_processed": len(ix_dicts),
        }


property_service = PropertyService()
