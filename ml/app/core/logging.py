import sys
import os
from loguru import logger
from app.core.config import settings


def setup_logging() -> None:
    """Configure loguru sinks for console and rotating file."""
    logger.remove()

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    # Console sink
    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=True,
        diagnose=settings.DEBUG,
    )

    # Rotating file sink
    log_dir = os.path.dirname(settings.LOG_FILE)
    if log_dir:
        os.makedirs(log_dir, exist_ok=True)

    logger.add(
        settings.LOG_FILE,
        format=log_format,
        level=settings.LOG_LEVEL,
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
        compression="zip",
        backtrace=True,
        diagnose=settings.DEBUG,
        enqueue=True,
    )

    logger.info(f"Logging configured. Level={settings.LOG_LEVEL}, File={settings.LOG_FILE}")


def get_logger(name: str):
    return logger.bind(module=name)
