import asyncio
import random
import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

ua = UserAgent()


@dataclass
class SiteConfig:
    """Configuration for a scraping target site."""
    name: str
    base_url: str
    listing_selector: str
    title_selector: str
    price_selector: str
    city_selector: str
    bedrooms_selector: str
    bathrooms_selector: str
    area_selector: str
    description_selector: str
    images_selector: str
    property_type_selector: str
    next_page_selector: str
    amenities_selector: str = ""
    url_selector: str = "a"
    country_default: str = "Unknown"
    price_regex: str = r"[\d,.]+"
    area_regex: str = r"[\d.]+"


SITE_REGISTRY: Dict[str, SiteConfig] = {
    "mock_realestate": SiteConfig(
        name="mock_realestate",
        base_url="https://example-real-estate.com",
        listing_selector=".property-card",
        title_selector=".property-title",
        price_selector=".property-price",
        city_selector=".property-city",
        bedrooms_selector=".bedrooms",
        bathrooms_selector=".bathrooms",
        area_selector=".area",
        description_selector=".description",
        images_selector="img",
        property_type_selector=".property-type",
        next_page_selector=".next-page",
        amenities_selector=".amenity",
        country_default="US",
    ),
    "generic": SiteConfig(
        name="generic",
        base_url="",
        listing_selector="article, .listing, .property, .card",
        title_selector="h1, h2, h3, .title",
        price_selector=".price, [class*=price]",
        city_selector=".city, .location, [class*=location]",
        bedrooms_selector="[class*=bed]",
        bathrooms_selector="[class*=bath]",
        area_selector="[class*=area], [class*=size]",
        description_selector="p, .description, [class*=desc]",
        images_selector="img",
        property_type_selector="[class*=type]",
        next_page_selector="[class*=next], [rel=next]",
        amenities_selector="[class*=amenity], [class*=feature]",
        country_default="Unknown",
    ),

    # added websites

    # https://aqarmap.com.eg/en/for-sale/property-type/
    "aqarmap": SiteConfig(
        name="aqarmap",
        base_url="https://aqarmap.com.eg/en/for-sale/property-type/",
        listing_selector="article.listing-card",
        title_selector="h2.truncated-text",
        price_selector="data.text-title-5",
        city_selector="a.hover\\:underline.whitespace-nowrap",
        bedrooms_selector="span.text-caption-1.text-gray__dark_2:nth-of-type(2)",
        bathrooms_selector="span.text-caption-1.text-gray__dark_2:nth-of-type(3)",
        area_selector="span.text-caption-1.text-gray__dark_2:nth-of-type(1)",
        description_selector="",
        images_selector="img",
        property_type_selector="",
        next_page_selector="link[rel='next']",
        amenities_selector="",
        country_default="Egypt",
    ),
}


def _extract_text(soup: Optional[BeautifulSoup], selector: str) -> str:
    if not soup or not selector:
        return ""
    el = soup.select_one(selector)
    return el.get_text(strip=True) if el else ""


def _extract_number(text: str, regex: str = r"[\d,.]+") -> Optional[float]:
    if not text:
        return None
    match = re.search(regex, text.replace(",", ""))
    if match:
        try:
            return float(match.group().replace(",", ""))
        except ValueError:
            return None
    return None


def _extract_images(soup: Optional[BeautifulSoup], selector: str) -> List[str]:
    if not soup or not selector:
        return []
    imgs = soup.select(selector)
    urls = []
    for img in imgs:
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if src and src.startswith("http"):
            urls.append(src)
    return urls[:10]


class BS4Scraper:
    """Site-config-driven scraper using BeautifulSoup4 and httpx."""

    def __init__(self):
        self._semaphore = asyncio.Semaphore(settings.SCRAPING_CONCURRENCY)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": ua.random,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=2, max=10))
    async def _fetch(self, url: str, client: httpx.AsyncClient) -> Optional[str]:
        async with self._semaphore:
            await asyncio.sleep(settings.SCRAPING_DELAY_SECONDS + random.uniform(0, 1))
            response = await client.get(
                url,
                headers=self._get_headers(),
                timeout=settings.SCRAPING_TIMEOUT_SECONDS,
                follow_redirects=True,
            )
            response.raise_for_status()
            return response.text

    def _parse_listing(
        self, card: BeautifulSoup, config: SiteConfig, base_url: str
    ) -> Optional[Dict[str, Any]]:
        try:
            title = _extract_text(card, config.title_selector)
            if not title:
                # Try generic heading
                for tag in ["h1", "h2", "h3", "h4"]:
                    el = card.find(tag)
                    if el:
                        title = el.get_text(strip=True)
                        break
            if not title:
                return None

            price_text = _extract_text(card, config.price_selector)
            price = _extract_number(price_text, config.price_regex)

            city_text = _extract_text(card, config.city_selector)
            bedrooms_text = _extract_text(card, config.bedrooms_selector)
            bedrooms = int(_extract_number(bedrooms_text) or 0) or None
            bathrooms_text = _extract_text(card, config.bathrooms_selector)
            bathrooms = int(_extract_number(bathrooms_text) or 0) or None
            area_text = _extract_text(card, config.area_selector)
            area = _extract_number(area_text, config.area_regex)
            description = _extract_text(card, config.description_selector)
            property_type = _extract_text(card, config.property_type_selector) or "other"
            images = _extract_images(card, config.images_selector)

            # Amenities
            amenity_els = card.select(config.amenities_selector) if config.amenities_selector else []
            amenities = [el.get_text(strip=True) for el in amenity_els if el.get_text(strip=True)]

            # Listing URL
            link_el = card.select_one(config.url_selector)
            listing_url = None
            if link_el and link_el.get("href"):
                href = link_el["href"]
                listing_url = href if href.startswith("http") else urljoin(base_url, href)

            return {
                "title": title[:500],
                "price": price,
                "currency": "USD",
                "city": city_text[:200] if city_text else None,
                "country": config.country_default,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "area": area,
                "description": description[:5000] if description else None,
                "property_type": property_type.lower()[:50],
                "images": images,
                "amenities": amenities[:20],
                "listing_url": listing_url,
                "source_site": config.name,
            }
        except Exception as e:
            logger.warning(f"Error parsing listing card: {e}")
            return None

    def _get_config(self, site_name: str, target_url: str) -> SiteConfig:
        config = SITE_REGISTRY.get(site_name)
        if config is None:
            config = SITE_REGISTRY["generic"]
        if target_url:
            config.base_url = target_url
        return config

    async def scrape(
        self, site_name: str, target_url: str, max_pages: int = 5
    ) -> List[Dict[str, Any]]:
        config = self._get_config(site_name, target_url)
        all_properties: List[Dict[str, Any]] = []
        current_url = target_url

        async with httpx.AsyncClient(verify=False) as client:
            for page in range(1, max_pages + 1):
                logger.info(f"Scraping {site_name} page {page}: {current_url}")
                try:
                    html = await self._fetch(current_url, client)
                    if not html:
                        break
                except Exception as e:
                    logger.error(f"Failed to fetch page {page}: {e}")
                    break

                soup = BeautifulSoup(html, "lxml")
                cards = soup.select(config.listing_selector)

                if not cards:
                    logger.info(f"No cards found with selector '{config.listing_selector}' on page {page}, stopping.")
                    break

                for card in cards:
                    prop = self._parse_listing(card, config, config.base_url)
                    if prop:
                        all_properties.append(prop)

                logger.info(f"Page {page}: found {len(cards)} cards, extracted {len(all_properties)} total so far.")

                # Follow pagination
                next_el = soup.select_one(config.next_page_selector)
                if not next_el or not next_el.get("href"):
                    break
                next_href = next_el["href"]
                current_url = next_href if next_href.startswith("http") else urljoin(config.base_url, next_href)

        logger.info(f"Scraping complete for {site_name}: {len(all_properties)} properties extracted.")
        return all_properties


scraper = BS4Scraper()
