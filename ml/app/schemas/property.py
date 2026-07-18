import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, field_validator


class PropertyBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="USD", max_length=10)
    city: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    bedrooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    area: Optional[float] = Field(None, ge=0)
    property_type: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    listing_url: Optional[str] = None
    source_site: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=500)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Optional[float] = None
    property_type: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class PropertyResponse(PropertyBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    price_per_sqm: Optional[float] = None
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime


class PropertyListResponse(BaseModel):
    items: List[PropertyResponse]
    total: int
    page: int
    page_size: int
    pages: int


class PropertySearchParams(BaseModel):
    city: Optional[str] = None
    country: Optional[str] = None
    property_type: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    min_bedrooms: Optional[int] = Field(None, ge=0)
    max_bedrooms: Optional[int] = Field(None, ge=0)
    min_area: Optional[float] = Field(None, ge=0)
    max_area: Optional[float] = Field(None, ge=0)
    amenities: Optional[List[str]] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")

    @field_validator("sort_order")
    @classmethod
    def validate_sort_order(cls, v: str) -> str:
        if v not in ("asc", "desc"):
            raise ValueError("sort_order must be 'asc' or 'desc'")
        return v


# User schemas
class UserPreferences(BaseModel):
    preferred_cities: Optional[List[str]] = None
    preferred_property_types: Optional[List[str]] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    min_bedrooms: Optional[int] = Field(None, ge=0)
    max_bedrooms: Optional[int] = Field(None, ge=0)
    min_area: Optional[float] = Field(None, ge=0)
    preferred_amenities: Optional[List[str]] = None


class UserCreate(BaseModel):
    email: Optional[str] = None
    preferences: Optional[UserPreferences] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: Optional[str] = None
    preferred_cities: Optional[List[str]] = None
    preferred_property_types: Optional[List[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_bedrooms: Optional[int] = None
    max_bedrooms: Optional[int] = None
    min_area: Optional[float] = None
    preferred_amenities: Optional[List[str]] = None
    created_at: datetime


# Interaction schemas
class InteractionCreate(BaseModel):
    user_id: uuid.UUID
    property_id: uuid.UUID
    interaction_type: str
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)


class InteractionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    property_id: uuid.UUID
    interaction_type: str
    rating: Optional[float] = None
    implicit_score: float
    created_at: datetime


# Scraping schemas
class ScrapeRequest(BaseModel):
    site_name: str
    target_url: str
    max_pages: int = Field(default=5, ge=1, le=50)


class ScrapeStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    site_name: str
    target_url: str
    status: str
    celery_task_id: Optional[str] = None
    properties_found: int
    properties_saved: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


# Recommendation schemas
class RecommendationItem(BaseModel):
    property: PropertyResponse
    score: float
    reason: str


class RecommendationResponse(BaseModel):
    user_id: uuid.UUID
    recommendations: List[RecommendationItem]
    strategy: str
    generated_at: datetime


class SimilarPropertyResponse(BaseModel):
    property_id: uuid.UUID
    similar_properties: List[RecommendationItem]
    generated_at: datetime


# Training schemas
class TrainRequest(BaseModel):
    model_type: str = Field(default="all")  # "content", "collaborative", "all"
    force_retrain: bool = False


class TrainResponse(BaseModel):
    task_id: str
    model_type: str
    status: str
    message: str


# Health schema
class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    redis: str
