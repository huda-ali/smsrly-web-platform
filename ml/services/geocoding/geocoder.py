import asyncio
from typing import Optional, Tuple
from geopy.geocoders import Nominatim, GoogleV3
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeocoderWrapper:
    def __init__(self):
        if settings.GEOCODING_PROVIDER == "google" and settings.GOOGLE_MAPS_API_KEY:
            self._geocoder = GoogleV3(api_key=settings.GOOGLE_MAPS_API_KEY, timeout=10)
        else:
            self._geocoder = Nominatim(user_agent=settings.NOMINATIM_USER_AGENT, timeout=10)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    def _geocode_sync(self, address: str) -> Optional[Tuple[float, float]]:
        try:
            location = self._geocoder.geocode(address)
            if location:
                return location.latitude, location.longitude
        except (GeocoderTimedOut, GeocoderUnavailable) as e:
            logger.warning(f"Geocoder error for '{address}': {e}")
            raise
        return None

    async def geocode(self, address: str) -> Optional[Tuple[float, float]]:
        """Async-safe geocoding (runs sync call in thread pool)."""
        if not address:
            return None
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._geocode_sync, address)
            return result
        except Exception as e:
            logger.error(f"Geocoding failed for '{address}': {e}")
            return None

    async def reverse_geocode(self, lat: float, lon: float) -> Optional[str]:
        """Reverse geocode coordinates to an address string."""
        try:
            loop = asyncio.get_event_loop()
            location = await loop.run_in_executor(
                None, lambda: self._geocoder.reverse(f"{lat},{lon}")
            )
            if location:
                return location.address
        except Exception as e:
            logger.error(f"Reverse geocode failed ({lat},{lon}): {e}")
        return None


geocoder = GeocoderWrapper()
