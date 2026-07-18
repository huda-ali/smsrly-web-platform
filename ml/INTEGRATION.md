# INTEGRATION.md — Real Estate AI API Integration Guide

## Overview
Base URL: `http://localhost:8000/api/v1`
All responses are JSON. Authentication is not enforced in this release; add a Bearer token middleware to secure production deployments.

---

## REST API Reference

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/properties` | List with filters & pagination |
| POST | `/properties` | Create a property |
| GET | `/properties/{id}` | Retrieve one property |
| PATCH | `/properties/{id}` | Update property fields |
| DELETE | `/properties/{id}` | Deactivate/remove property |

#### Query Parameters for GET /properties
- `city`, `country`, `property_type`
- `min_price`, `max_price`
- `min_bedrooms`, `max_bedrooms`
- `min_area`, `max_area`
- `page` (default 1), `page_size` (default 20, max 100)
- `sort_by` (default `created_at`), `sort_order` (`asc`|`desc`)

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recommendations/{user_id}` | Personalised recommendations |
| GET | `/similar-properties/{property_id}` | Similar property suggestions |
| POST | `/interact` | Record a user interaction |
| POST | `/user/preferences?user_id={id}` | Update user preferences |
| POST | `/train-model` | Trigger async model retraining |

### Scraping
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scrape` | Start a scrape job |
| GET | `/scrape/status/{job_id}` | Check scrape job status |

---

## C# Integration Example

```csharp
using System.Net.Http.Json;

public class RealEstateApiClient
{
    private readonly HttpClient _http;
    public RealEstateApiClient(HttpClient http) => _http = http;

    // List properties with filters
    public async Task<PropertyListResponse> GetPropertiesAsync(
        string? city = null, decimal? minPrice = null, int page = 1)
    {
        var query = $"/api/v1/properties?page={page}";
        if (city != null) query += $"&city={Uri.EscapeDataString(city)}";
        if (minPrice != null) query += $"&min_price={minPrice}";
        return await _http.GetFromJsonAsync<PropertyListResponse>(query);
    }

    // Get recommendations for a user
    public async Task<RecommendationResponse> GetRecommendationsAsync(Guid userId, int topN = 10)
    {
        return await _http.GetFromJsonAsync<RecommendationResponse>(
            $"/api/v1/recommendations/{userId}?top_n={topN}");
    }

    // Record an interaction
    public async Task RecordInteractionAsync(Guid userId, Guid propertyId, string type)
    {
        var payload = new { user_id = userId, property_id = propertyId, interaction_type = type };
        await _http.PostAsJsonAsync("/api/v1/interact", payload);
    }

    // Trigger scraping
    public async Task<ScrapeStatusResponse> StartScrapeAsync(string siteName, string url, int maxPages = 5)
    {
        var payload = new { site_name = siteName, target_url = url, max_pages = maxPages };
        var response = await _http.PostAsJsonAsync("/api/v1/scrape", payload);
        return await response.Content.ReadFromJsonAsync<ScrapeStatusResponse>();
    }
}

// DTOs (simplified)
public record PropertyResponse(Guid Id, string Title, decimal? Price, string? City, int? Bedrooms);
public record PropertyListResponse(List<PropertyResponse> Items, int Total, int Page, int Pages);
public record RecommendationItem(PropertyResponse Property, double Score, string Reason);
public record RecommendationResponse(Guid UserId, List<RecommendationItem> Recommendations, string Strategy);
public record ScrapeStatusResponse(Guid Id, string Status, int PropertiesFound, int PropertiesSaved);
```

---

## React / TypeScript Integration Example

```typescript
// api/realEstate.ts
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export interface Property {
  id: string;
  title: string;
  price?: number;
  city?: string;
  country?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  property_type?: string;
  amenities?: string[];
  images?: string[];
  is_featured: boolean;
  created_at: string;
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
  page: number;
  pages: number;
}

export interface RecommendationItem {
  property: Property;
  score: number;
  reason: string;
}

export interface RecommendationsResponse {
  user_id: string;
  recommendations: RecommendationItem[];
  strategy: string;
}

// Fetch properties with optional filters
export async function fetchProperties(params: {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  page?: number;
  pageSize?: number;
}): Promise<PropertyListResponse> {
  const qs = new URLSearchParams();
  if (params.city) qs.set('city', params.city);
  if (params.minPrice) qs.set('min_price', String(params.minPrice));
  if (params.maxPrice) qs.set('max_price', String(params.maxPrice));
  if (params.propertyType) qs.set('property_type', params.propertyType);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('page_size', String(params.pageSize));

  const res = await fetch(`${BASE_URL}/properties?${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Get personalised recommendations
export async function fetchRecommendations(
  userId: string,
  topN = 10
): Promise<RecommendationsResponse> {
  const res = await fetch(`${BASE_URL}/recommendations/${userId}?top_n=${topN}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Record user interaction
export async function recordInteraction(
  userId: string,
  propertyId: string,
  interactionType: 'view' | 'like' | 'save' | 'contact' | 'share' | 'dislike',
  rating?: number
): Promise<void> {
  await fetch(`${BASE_URL}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      property_id: propertyId,
      interaction_type: interactionType,
      rating,
    }),
  });
}

// Update preferences
export async function updatePreferences(userId: string, prefs: {
  preferred_cities?: string[];
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
}): Promise<void> {
  await fetch(`${BASE_URL}/user/preferences?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
}
```

---

## Running Locally (without Docker)

```bash
# 1. Create virtual environment
python -m venv .venv && source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env and configure
cp .env.example .env
# Edit .env: set DATABASE_URL and REDIS_URL to your local instances

# 4. Run migrations
alembic upgrade head

# 5. Seed sample data
python scripts/seed_data.py

# 6. Start the API
uvicorn app.main:app --reload --port 8000

# 7. Start Celery worker (separate terminal)
celery -A services.workers.celery_app worker --loglevel=info

# 8. Start Celery Beat (separate terminal)
celery -A services.workers.celery_app beat --loglevel=info
```

---

## Running with Docker (recommended)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services
docker-compose up --build -d

# 3. Check health
curl http://localhost:8000/health

# 4. View API docs
open http://localhost:8000/docs

# 5. Monitor Celery tasks
open http://localhost:5555  # Flower dashboard

# 6. Seed data (optional)
docker-compose exec api python scripts/seed_data.py

# 7. Trigger initial model training
curl -X POST http://localhost:8000/api/v1/train-model \
  -H "Content-Type: application/json" \
  -d '{"model_type": "all", "force_retrain": false}'
```

---

## Recommendation System Architecture

```
User Request
    │
    ▼
HybridRecommendationEngine
    ├── ContentBasedEngine (40%)
    │   └── Cosine similarity on property feature vectors
    │       (price, area, bedrooms, amenities, location, type)
    ├── CollaborativeFilteringEngine (40%)
    │   └── ALS matrix factorisation on user-item interactions
    │       (view, like, save, contact, share, rating)
    └── LocationScore (20%)
        └── Haversine distance from user's preferred location
            × Price range penalty for out-of-budget properties
```

### Feature Vector Components
Each property is encoded as a 27-dimensional vector:
- **Numeric** (7): price, area, bedrooms, bathrooms, lat, lon, price_per_sqm
- **Amenities** (10): binary encoding of 10 amenity groups
- **Property type** (10): one-hot encoding of 10 property types

### Interaction Weights
| Type | Implicit Score |
|------|---------------|
| contact | 5.0 |
| save | 4.0 |
| like | 3.0 |
| share | 2.0 |
| view | 1.0 |
| dislike | -1.0 |

---

## Scraping

Add new site configurations in `services/scrapers/bs4_scraper.py` under `SITE_REGISTRY`:

```python
SITE_REGISTRY["my_site"] = SiteConfig(
    name="my_site",
    base_url="https://my-real-estate-site.com/listings",
    listing_selector=".property-card",
    title_selector=".prop-title",
    price_selector=".prop-price",
    # ... other CSS selectors
    country_default="Egypt",
)
```

Then trigger via API:
```bash
curl -X POST http://localhost:8000/api/v1/scrape \
  -H "Content-Type: application/json" \
  -d '{"site_name": "my_site", "target_url": "https://my-real-estate-site.com/listings", "max_pages": 10}'
```
