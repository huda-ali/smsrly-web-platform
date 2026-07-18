import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Float, Integer, Boolean, DateTime, Text, JSON,
    ForeignKey, Enum as SAEnum, func, Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.db.session import Base


class PropertyType(str, enum.Enum):
    apartment = "apartment"
    house = "house"
    villa = "villa"
    studio = "studio"
    penthouse = "penthouse"
    townhouse = "townhouse"
    commercial = "commercial"
    land = "land"
    other = "other"


class ScrapeStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class InteractionType(str, enum.Enum):
    view = "view"
    like = "like"
    dislike = "dislike"
    contact = "contact"
    save = "save"
    share = "share"


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    price_per_sqm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Location
    city: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Property details
    bedrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    area: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # sqm
    property_type: Mapped[Optional[str]] = mapped_column(
        SAEnum(PropertyType, name="property_type_enum"), nullable=True
    )
    amenities: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    images: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)

    # Source
    listing_url: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True, unique=True)
    source_site: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # ML
    feature_vector: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    embedding: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Meta
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    interactions: Mapped[List["UserInteraction"]] = relationship("UserInteraction", back_populates="property")

    __table_args__ = (
        Index("ix_properties_city", "city"),
        Index("ix_properties_country", "country"),
        Index("ix_properties_price", "price"),
        Index("ix_properties_property_type", "property_type"),
        Index("ix_properties_bedrooms", "bedrooms"),
        Index("ix_properties_created_at", "created_at"),
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Preferences
    preferred_cities: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    preferred_property_types: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    min_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_bedrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_bedrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    min_area: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    preferred_amenities: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)

    # Profile vector for collaborative filtering
    preference_vector: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    interactions: Mapped[List["UserInteraction"]] = relationship("UserInteraction", back_populates="user")


class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    interaction_type: Mapped[str] = mapped_column(
        SAEnum(InteractionType, name="interaction_type_enum"), nullable=False
    )
    rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 1-5 explicit rating
    implicit_score: Mapped[float] = mapped_column(Float, default=1.0)  # derived from interaction type
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="interactions")
    property: Mapped["Property"] = relationship("Property", back_populates="interactions")

    __table_args__ = (
        Index("ix_interactions_user_id", "user_id"),
        Index("ix_interactions_property_id", "property_id"),
        Index("ix_interactions_created_at", "created_at"),
    )


class ScrapeJob(Base):
    __tablename__ = "scrape_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_name: Mapped[str] = mapped_column(String(200), nullable=False)
    target_url: Mapped[str] = mapped_column(String(2000), nullable=False)
    status: Mapped[str] = mapped_column(
        SAEnum(ScrapeStatus, name="scrape_status_enum"), default=ScrapeStatus.pending
    )
    celery_task_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    properties_found: Mapped[int] = mapped_column(Integer, default=0)
    properties_saved: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
