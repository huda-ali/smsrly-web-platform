import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.property import ScrapeRequest, ScrapeStatusResponse
from services.property_service import property_service
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/scrape", tags=["Scraping"])


@router.post("", response_model=ScrapeStatusResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_scrape(
    request: ScrapeRequest,
    db: AsyncSession = Depends(get_db),
):
    from services.workers.celery_app import scrape_site

    job = await property_service.create_scrape_job(db, request.site_name, request.target_url)
    await db.commit()

    task = scrape_site.apply_async(
        args=[str(job.id), request.site_name, request.target_url, request.max_pages],
        queue="scraping",
    )

    job = await property_service.update_scrape_job(db, job.id, celery_task_id=task.id)
    await db.commit()

    logger.info(f"Scrape job {job.id} queued (task={task.id})")
    return ScrapeStatusResponse.model_validate(job)


@router.get("/status/{job_id}", response_model=ScrapeStatusResponse)
async def get_scrape_status(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    job = await property_service.get_scrape_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Scrape job not found")
    return ScrapeStatusResponse.model_validate(job)
