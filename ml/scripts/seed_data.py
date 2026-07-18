#!/usr/bin/env python3
"""
Seed script — populates the database with realistic sample properties and users
for development and demo purposes.

Usage:
    python scripts/seed_data.py
"""
import asyncio
import random
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.session import AsyncSessionLocal, init_db
from app.db.models.property import Property, User, UserInteraction

CITIES = [
    ("Cairo", "Egypt"), ("Alexandria", "Egypt"), ("Giza", "Egypt"),
    ("Dubai", "UAE"), ("Abu Dhabi", "UAE"), ("Sharjah", "UAE"),
    ("Riyadh", "Saudi Arabia"), ("Jeddah", "Saudi Arabia"),
    ("Istanbul", "Turkey"), ("Ankara", "Turkey"),
    ("London", "UK"), ("Manchester", "UK"),
    ("New York", "USA"), ("Los Angeles", "USA"), ("Miami", "USA"),
]

PROPERTY_TYPES = ["apartment", "house", "villa", "studio", "penthouse", "townhouse"]

AMENITIES_POOL = [
    "pool", "gym", "parking", "security", "elevator", "balcony",
    "air conditioning", "garden", "furnished", "pet friendly",
    "rooftop pool", "concierge", "sea view", "city view",
]

TITLES = [
    "{beds}-Bedroom {ptype} in {city}",
    "Luxury {ptype} with {amenity} in {city}",
    "Modern {ptype} near {city} City Centre",
    "Spacious {ptype} in Prime {city} Location",
    "Brand New {ptype} with {amenity} — {city}",
    "Stunning {ptype} in {city} with Views",
]


def _random_price(ptype: str) -> float:
    base = {
        "studio": (40000, 150000),
        "apartment": (80000, 500000),
        "house": (150000, 800000),
        "townhouse": (200000, 700000),
        "villa": (500000, 3000000),
        "penthouse": (1000000, 5000000),
    }
    lo, hi = base.get(ptype, (100000, 600000))
    return round(random.uniform(lo, hi), -3)


def _random_area(ptype: str) -> float:
    base = {
        "studio": (30, 60),
        "apartment": (60, 200),
        "house": (120, 350),
        "townhouse": (150, 300),
        "villa": (250, 800),
        "penthouse": (200, 600),
    }
    lo, hi = base.get(ptype, (60, 300))
    return round(random.uniform(lo, hi), 1)


def _gen_property(idx: int) -> dict:
    city, country = random.choice(CITIES)
    ptype = random.choice(PROPERTY_TYPES)
    beds = random.randint(0 if ptype == "studio" else 1, 6)
    baths = random.randint(1, max(1, beds))
    area = _random_area(ptype)
    price = _random_price(ptype)
    amenity = random.choice(AMENITIES_POOL)
    title_tpl = random.choice(TITLES)
    title = title_tpl.format(beds=beds, ptype=ptype.capitalize(), city=city, amenity=amenity)
    amenities = random.sample(AMENITIES_POOL, k=random.randint(2, 7))
    lat = round(random.uniform(25, 45), 6)
    lon = round(random.uniform(28, 55), 6)

    return {
        "title": title[:500],
        "description": (
            f"Beautiful {ptype} in {city}, {country}. "
            f"Features {beds} bedrooms and {baths} bathrooms across {area} sqm. "
            f"Amenities include {', '.join(amenities[:4])}. "
            f"Prime location with easy access to city centre."
        ),
        "price": price,
        "currency": "USD",
        "price_per_sqm": round(price / area, 2) if area else None,
        "city": city,
        "country": country,
        "address": f"{random.randint(1, 999)} Main Street, {city}",
        "latitude": lat,
        "longitude": lon,
        "bedrooms": beds,
        "bathrooms": baths,
        "area": area,
        "property_type": ptype,
        "amenities": amenities,
        "images": [f"https://picsum.photos/seed/{idx + i}/800/600" for i in range(3)],
        "listing_url": f"https://example-listings.com/property/{idx:05d}",
        "source_site": "seed",
        "is_active": True,
        "is_featured": random.random() < 0.1,
    }


async def seed():
    print("Initialising database...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # Check existing count
        from sqlalchemy import select, func
        count_res = await db.execute(select(func.count()).select_from(Property))
        existing = count_res.scalar_one()
        if existing >= 200:
            print(f"Database already has {existing} properties. Skipping seed.")
            return

        print("Seeding 500 properties...")
        props = []
        for i in range(500):
            pdata = _gen_property(i)
            prop = Property(**pdata)
            db.add(prop)
            props.append(prop)

        await db.flush()

        print("Seeding 50 users...")
        users = []
        for j in range(50):
            city, country = random.choice(CITIES)
            user = User(
                preferred_cities=[city],
                preferred_property_types=random.sample(PROPERTY_TYPES, k=2),
                min_price=random.choice([50000, 100000, 200000]),
                max_price=random.choice([500000, 1000000, 2000000]),
                min_bedrooms=random.choice([1, 2, 3]),
            )
            db.add(user)
            users.append(user)

        await db.flush()

        print("Seeding interactions...")
        interaction_types = ["view", "view", "view", "like", "save", "contact"]
        for user in users:
            viewed = random.sample(props, k=random.randint(5, 30))
            for prop in viewed:
                itype = random.choice(interaction_types)
                interaction = UserInteraction(
                    user_id=user.id,
                    property_id=prop.id,
                    interaction_type=itype,
                    rating=round(random.uniform(2, 5), 1) if itype in ("like", "contact") else None,
                    implicit_score={"view": 1.0, "like": 3.0, "save": 4.0, "contact": 5.0}.get(itype, 1.0),
                )
                db.add(interaction)

        await db.commit()
        print("Seed complete: 500 properties, 50 users, and interactions.")


if __name__ == "__main__":
    asyncio.run(seed())
