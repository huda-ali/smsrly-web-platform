from functools import lru_cache
from typing import List, Optional
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "RealEstateAI"
    APP_ENV: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://realestate:realestate_pass@db:5432/realestate_db"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://realestate:realestate_pass@db:5432/realestate_db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # Geocoding
    GEOCODING_PROVIDER: str = "nominatim"
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    NOMINATIM_USER_AGENT: str = "real_estate_ai_v1"

    # ML Models
    MODEL_DIR: str = "/app/models"
    RETRAIN_INTERVAL_HOURS: int = 24
    MIN_INTERACTIONS_FOR_CF: int = 5

    # Scraping
    SCRAPING_CONCURRENCY: int = 5
    SCRAPING_DELAY_SECONDS: float = 2.0
    SCRAPING_TIMEOUT_SECONDS: int = 30
    SCRAPING_MAX_RETRIES: int = 3

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "/app/logs/app.log"
    LOG_ROTATION: str = "10 MB"
    LOG_RETENTION: str = "30 days"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080"]

    # Recommendation
    RECOMMENDATION_CACHE_TTL: int = 3600
    TOP_N_RECOMMENDATIONS: int = 10
    CONTENT_WEIGHT: float = 0.4
    COLLABORATIVE_WEIGHT: float = 0.4
    LOCATION_WEIGHT: float = 0.2

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
