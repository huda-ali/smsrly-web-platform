import re
import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any, Tuple
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import joblib
import os

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

INTERACTION_SCORES = {
    "view": 1.0,
    "like": 3.0,
    "save": 4.0,
    "contact": 5.0,
    "share": 2.0,
    "dislike": -1.0,
}

AMENITY_GROUPS = {
    "parking": ["parking", "garage", "carport"],
    "pool": ["pool", "swimming pool", "rooftop pool"],
    "gym": ["gym", "fitness", "workout"],
    "security": ["security", "guard", "cctv", "gated"],
    "elevator": ["elevator", "lift"],
    "balcony": ["balcony", "terrace", "patio"],
    "ac": ["air conditioning", "ac", "hvac", "central air"],
    "garden": ["garden", "yard", "lawn"],
    "furnished": ["furnished", "semi-furnished"],
    "pet_friendly": ["pet friendly", "pets allowed"],
}


class DataProcessor:
    """Cleans, engineers, normalises and vectorises property data."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.property_type_encoder = LabelEncoder()
        self.tfidf = TfidfVectorizer(max_features=100, stop_words="english")
        self._is_fitted = False
        self._load_artifacts()

    def _load_artifacts(self):
        scaler_path = os.path.join(settings.MODEL_DIR, "scaler.joblib")
        encoder_path = os.path.join(settings.MODEL_DIR, "property_type_encoder.joblib")
        tfidf_path = os.path.join(settings.MODEL_DIR, "tfidf.joblib")

        if all(os.path.exists(p) for p in [scaler_path, encoder_path, tfidf_path]):
            try:
                self.scaler = joblib.load(scaler_path)
                self.property_type_encoder = joblib.load(encoder_path)
                self.tfidf = joblib.load(tfidf_path)
                self._is_fitted = True
                logger.info("Loaded preprocessor artifacts from disk.")
            except Exception as e:
                logger.warning(f"Could not load artifacts: {e}")

    def save_artifacts(self):
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        joblib.dump(self.scaler, os.path.join(settings.MODEL_DIR, "scaler.joblib"))
        joblib.dump(self.property_type_encoder, os.path.join(settings.MODEL_DIR, "property_type_encoder.joblib"))
        joblib.dump(self.tfidf, os.path.join(settings.MODEL_DIR, "tfidf.joblib"))
        logger.info("Saved preprocessor artifacts to disk.")

    def clean_price(self, price: Any) -> Optional[float]:
        if price is None:
            return None
        if isinstance(price, (int, float)):
            return float(price)
        if isinstance(price, str):
            cleaned = re.sub(r"[^\d.]", "", price.replace(",", ""))
            try:
                return float(cleaned)
            except ValueError:
                return None
        return None

    def clean_area(self, area: Any) -> Optional[float]:
        if area is None:
            return None
        if isinstance(area, (int, float)):
            return float(area)
        if isinstance(area, str):
            match = re.search(r"[\d.]+", area)
            if match:
                val = float(match.group())
                if "ft" in area.lower():
                    val = val * 0.0929  # sq ft to sqm
                return val
        return None

    def encode_amenities(self, amenities: Optional[List[str]]) -> Dict[str, int]:
        encoded = {k: 0 for k in AMENITY_GROUPS}
        if not amenities:
            return encoded
        amenities_lower = [a.lower() for a in amenities]
        for group, keywords in AMENITY_GROUPS.items():
            for kw in keywords:
                if any(kw in a for a in amenities_lower):
                    encoded[group] = 1
                    break
        return encoded

    def build_feature_vector(self, property_dict: Dict[str, Any]) -> List[float]:
        """Build a numeric feature vector from a property record."""
        price = self.clean_price(property_dict.get("price")) or 0.0
        area = self.clean_area(property_dict.get("area")) or 0.0
        bedrooms = float(property_dict.get("bedrooms") or 0)
        bathrooms = float(property_dict.get("bathrooms") or 0)
        latitude = float(property_dict.get("latitude") or 0)
        longitude = float(property_dict.get("longitude") or 0)
        price_per_sqm = (price / area) if area > 0 else 0.0

        amenity_features = list(self.encode_amenities(property_dict.get("amenities")).values())

        # Property type one-hot (10 types)
        property_types = ["apartment", "house", "villa", "studio", "penthouse", "townhouse", "commercial", "land", "other", "unknown"]
        pt = (property_dict.get("property_type") or "unknown").lower()
        pt_onehot = [1.0 if pt == t else 0.0 for t in property_types]

        vector = [
            price,
            area,
            bedrooms,
            bathrooms,
            latitude,
            longitude,
            price_per_sqm,
        ] + amenity_features + pt_onehot

        return vector

    def fit_transform(self, properties: List[Dict[str, Any]]) -> np.ndarray:
        """Fit scaler and transform a list of property dicts to a matrix."""
        vectors = [self.build_feature_vector(p) for p in properties]
        matrix = np.array(vectors, dtype=np.float32)
        matrix = np.nan_to_num(matrix, nan=0.0, posinf=1e6, neginf=0.0)
        matrix = self.scaler.fit_transform(matrix)
        self._is_fitted = True
        return matrix

    def transform(self, properties: List[Dict[str, Any]]) -> np.ndarray:
        """Transform using fitted scaler."""
        vectors = [self.build_feature_vector(p) for p in properties]
        matrix = np.array(vectors, dtype=np.float32)
        matrix = np.nan_to_num(matrix, nan=0.0, posinf=1e6, neginf=0.0)
        if self._is_fitted:
            matrix = self.scaler.transform(matrix)
        return matrix

    def compute_interaction_matrix(
        self, interactions: List[Dict[str, Any]], user_ids: List[str], property_ids: List[str]
    ) -> np.ndarray:
        """Build user-item interaction matrix for collaborative filtering."""
        user_idx = {uid: i for i, uid in enumerate(user_ids)}
        prop_idx = {pid: i for i, pid in enumerate(property_ids)}
        matrix = np.zeros((len(user_ids), len(property_ids)), dtype=np.float32)

        for ix in interactions:
            uid = str(ix["user_id"])
            pid = str(ix["property_id"])
            itype = ix.get("interaction_type", "view")
            rating = ix.get("rating")

            if uid not in user_idx or pid not in prop_idx:
                continue

            score = INTERACTION_SCORES.get(itype, 1.0)
            if rating is not None:
                score = float(rating)

            i = user_idx[uid]
            j = prop_idx[pid]
            matrix[i][j] = max(matrix[i][j], score)

        return matrix

    def property_to_dict(self, prop) -> Dict[str, Any]:
        """Convert ORM Property to dict for processing."""
        return {
            "id": str(prop.id),
            "price": prop.price,
            "area": prop.area,
            "bedrooms": prop.bedrooms,
            "bathrooms": prop.bathrooms,
            "latitude": prop.latitude,
            "longitude": prop.longitude,
            "property_type": prop.property_type,
            "amenities": prop.amenities,
            "city": prop.city,
            "country": prop.country,
            "description": prop.description,
        }


data_processor = DataProcessor()
