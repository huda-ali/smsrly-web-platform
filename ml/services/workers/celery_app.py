import asyncio
import uuid
from datetime import datetime
from celery import Celery
from celery.schedules import crontab
from kombu import Queue

from app.core.config import settings
from app.core.logging import get_logger, setup_logging

setup_logging()
logger = get_logger(__name__)

celery_app = Celery(
    "real_estate_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["services.workers.celery_app"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_track_started=True,
    result_expires=86400,
    task_queues=(
        Queue("default"),
        Queue("scraping"),
        Queue("ml"),
        Queue("geocoding"),
    ),
    task_default_queue="default",
    beat_schedule={
        "retrain-models-daily": {
            "task": "services.workers.celery_app.retrain_models",
            "schedule": crontab(hour=2, minute=0),
            "options": {"queue": "ml"},
        },
        "geocode-pending-hourly": {
            "task": "services.workers.celery_app.geocode_pending",
            "schedule": crontab(minute=0),
            "options": {"queue": "geocoding"},
        },
    },
)


def _run_async(coro):
    """Run an async coroutine in a new event loop for Celery tasks."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(
    bind=True,
    name="services.workers.celery_app.scrape_site",
    queue="scraping",
    max_retries=3,
    default_retry_delay=60,
)
def scrape_site(self, job_id: str, site_name: str, target_url: str, max_pages: int = 5):
    """Celery task to scrape a real estate site and store results in DB."""
    logger.info(f"[Task {self.request.id}] Starting scrape: {site_name} @ {target_url}")

    async def _run():
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
        from sqlalchemy.orm import sessionmaker
        from services.scrapers.bs4_scraper import scraper
        from services.property_service import property_service

        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

        job_uuid = uuid.UUID(job_id)

        async with AsyncSessionLocal() as db:
            await property_service.update_scrape_job(
                db, job_uuid,
                status="running",
                celery_task_id=self.request.id,
                started_at=datetime.utcnow(),
            )
            await db.commit()

        try:
            properties = await scraper.scrape(site_name, target_url, max_pages)

            async with AsyncSessionLocal() as db:
                saved, skipped = await property_service.bulk_create_properties(db, properties)
                await property_service.update_scrape_job(
                    db, job_uuid,
                    status="completed",
                    properties_found=len(properties),
                    properties_saved=saved,
                    completed_at=datetime.utcnow(),
                )
                await db.commit()

            logger.info(f"[Task {self.request.id}] Scrape done: {saved} saved, {skipped} skipped.")
            return {"status": "completed", "found": len(properties), "saved": saved, "skipped": skipped}

        except Exception as e:
            logger.error(f"[Task {self.request.id}] Scrape failed: {e}")
            async with AsyncSessionLocal() as db:
                await property_service.update_scrape_job(
                    db, job_uuid,
                    status="failed",
                    error_message=str(e)[:2000],
                    completed_at=datetime.utcnow(),
                )
                await db.commit()
            raise self.retry(exc=e, countdown=60)

        finally:
            await engine.dispose()

    return _run_async(_run())


@celery_app.task(
    bind=True,
    name="services.workers.celery_app.geocode_pending",
    queue="geocoding",
)
def geocode_pending(self):
    """Geocode properties that are missing coordinates."""
    logger.info(f"[Task {self.request.id}] Geocoding pending properties...")

    async def _run():
        from sqlalchemy import select, and_
        from app.db.session import AsyncSessionLocal
        from app.db.models.property import Property
        from services.geocoding.geocoder import geocoder

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Property).where(
                    and_(
                        Property.latitude == None,
                        Property.address != None,
                        Property.is_active == True,
                    )
                ).limit(100)
            )
            props = list(result.scalars().all())

            geocoded = 0
            for prop in props:
                address_str = f"{prop.address}, {prop.city or ''}, {prop.country or ''}"
                coords = await geocoder.geocode(address_str)
                if coords:
                    prop.latitude, prop.longitude = coords
                    geocoded += 1

            await db.commit()
            logger.info(f"[Task {self.request.id}] Geocoded {geocoded}/{len(props)} properties.")
            return {"geocoded": geocoded, "total": len(props)}

    return _run_async(_run())


@celery_app.task(
    bind=True,
    name="services.workers.celery_app.retrain_models",
    queue="ml",
)
def retrain_models(self):
    """Periodic task to retrain recommendation models."""
    logger.info(f"[Task {self.request.id}] Starting model retraining...")

    async def _run():
        from app.db.session import AsyncSessionLocal
        from services.property_service import property_service

        async with AsyncSessionLocal() as db:
            result = await property_service.train_models(db)
            await db.commit()
        return result

    result = _run_async(_run())
    logger.info(f"[Task {self.request.id}] Retraining complete: {result}")
    return result
