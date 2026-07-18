import uuid
import math
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.property import (
    PropertyCreate, PropertyUpdate, PropertyResponse,
    PropertyListResponse, PropertySearchParams,
)
from services.property_service import property_service
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=PropertyListResponse)
async def list_properties(
    city: str = Query(None),
    country: str = Query(None),
    property_type: str = Query(None),
    min_price: float = Query(None, ge=0),
    max_price: float = Query(None, ge=0),
    min_bedrooms: int = Query(None, ge=0),
    max_bedrooms: int = Query(None, ge=0),
    min_area: float = Query(None, ge=0),
    max_area: float = Query(None, ge=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    params = PropertySearchParams(
        city=city, country=country, property_type=property_type,
        min_price=min_price, max_price=max_price,
        min_bedrooms=min_bedrooms, max_bedrooms=max_bedrooms,
        min_area=min_area, max_area=max_area,
        page=page, page_size=page_size,
        sort_by=sort_by, sort_order=sort_order,
    )
    items, total = await property_service.list_properties(db, params)
    pages = math.ceil(total / page_size) if total else 0
    return PropertyListResponse(
        items=[PropertyResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    data: PropertyCreate,
    db: AsyncSession = Depends(get_db),
):
    prop = await property_service.create_property(db, data)
    return PropertyResponse.model_validate(prop)


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    prop = await property_service.get_property(db, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyResponse.model_validate(prop)


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: uuid.UUID,
    data: PropertyUpdate,
    db: AsyncSession = Depends(get_db),
):
    prop = await property_service.update_property(db, property_id, data)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyResponse.model_validate(prop)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    deleted = await property_service.delete_property(db, property_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Property not found")
