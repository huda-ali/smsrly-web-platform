import os
import uuid
import math
import numpy as np
from typing import List, Dict, Optional, Tuple, Any
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
import joblib

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ContentBasedEngine:
    """Content-based filtering using property feature vectors."""

    def __init__(self):
        self.property_matrix: Optional[np.ndarray] = None
        self.property_ids: List[str] = []
        self._is_fitted = False

    def fit(self, property_ids: List[str], feature_matrix: np.ndarray) -> None:
        self.property_ids = property_ids
        self.property_matrix = feature_matrix
        self._is_fitted = True
        logger.info(f"ContentBasedEngine fitted with {len(property_ids)} properties.")

    def get_similar_properties(
        self, property_id: str, top_n: int = 10, exclude_ids: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        if not self._is_fitted or property_id not in self.property_ids:
            return []

        exclude_ids = exclude_ids or []
        idx = self.property_ids.index(property_id)
        query_vec = self.property_matrix[idx].reshape(1, -1)
        similarities = cosine_similarity(query_vec, self.property_matrix)[0]

        scored = [
            (self.property_ids[i], float(similarities[i]))
            for i in range(len(self.property_ids))
            if self.property_ids[i] != property_id and self.property_ids[i] not in exclude_ids
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_n]

    def get_user_content_recommendations(
        self, user_vector: np.ndarray, top_n: int = 10, exclude_ids: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        """Recommend properties similar to a user's preference vector."""
        if not self._is_fitted:
            return []

        exclude_ids = exclude_ids or []
        query_vec = user_vector.reshape(1, -1)
        similarities = cosine_similarity(query_vec, self.property_matrix)[0]

        scored = [
            (self.property_ids[i], float(similarities[i]))
            for i in range(len(self.property_ids))
            if self.property_ids[i] not in exclude_ids
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_n]

    def save(self, path: str) -> None:
        os.makedirs(path, exist_ok=True)
        joblib.dump({"property_ids": self.property_ids, "matrix": self.property_matrix}, os.path.join(path, "content_model.joblib"))
        logger.info(f"ContentBasedEngine saved to {path}")

    def load(self, path: str) -> None:
        model_file = os.path.join(path, "content_model.joblib")
        if os.path.exists(model_file):
            data = joblib.load(model_file)
            self.property_ids = data["property_ids"]
            self.property_matrix = data["matrix"]
            self._is_fitted = True
            logger.info(f"ContentBasedEngine loaded from {path} ({len(self.property_ids)} properties).")


class CollaborativeFilteringEngine:
    """Collaborative filtering using ALS implicit feedback."""

    def __init__(self):
        self.user_ids: List[str] = []
        self.property_ids: List[str] = []
        self.user_factors: Optional[np.ndarray] = None
        self.item_factors: Optional[np.ndarray] = None
        self._is_fitted = False
        self._n_factors = 50
        self._n_iterations = 20
        self._regularisation = 0.1

    def _als_step(self, X: np.ndarray, Y: np.ndarray, reg: float) -> np.ndarray:
        """One ALS optimisation step."""
        YtY = Y.T @ Y + reg * np.eye(Y.shape[1])
        X_new = np.zeros_like(X)
        for i in range(X.shape[0]):
            confidence = X[i]
            non_zero = confidence != 0
            if not np.any(non_zero):
                continue
            C_diag = np.diag(confidence[non_zero])
            Y_sub = Y[non_zero]
            X_new[i] = np.linalg.solve(
                Y_sub.T @ C_diag @ Y_sub + reg * np.eye(Y.shape[1]),
                Y_sub.T @ C_diag @ confidence[non_zero]
            )
        return X_new

    def fit(
        self,
        user_ids: List[str],
        property_ids: List[str],
        interaction_matrix: np.ndarray,
    ) -> None:
        self.user_ids = user_ids
        self.property_ids = property_ids
        n_users, n_items = interaction_matrix.shape
        n_factors = min(self._n_factors, n_users, n_items)

        # Initialise latent factors
        rng = np.random.default_rng(42)
        self.user_factors = rng.standard_normal((n_users, n_factors)).astype(np.float32) * 0.01
        self.item_factors = rng.standard_normal((n_items, n_factors)).astype(np.float32) * 0.01

        # Run ALS
        for iteration in range(self._n_iterations):
            self.user_factors = self._als_step(interaction_matrix, self.item_factors, self._regularisation)
            self.item_factors = self._als_step(interaction_matrix.T, self.user_factors, self._regularisation)
            if iteration % 5 == 0:
                logger.debug(f"ALS iteration {iteration}/{self._n_iterations}")

        self._is_fitted = True
        logger.info(f"CollaborativeFilteringEngine fitted: {n_users} users x {n_items} items, {n_factors} factors.")

    def recommend_for_user(
        self, user_id: str, top_n: int = 10, exclude_ids: Optional[List[str]] = None
    ) -> List[Tuple[str, float]]:
        if not self._is_fitted or user_id not in self.user_ids:
            return []

        exclude_ids = exclude_ids or []
        u_idx = self.user_ids.index(user_id)
        user_vec = self.user_factors[u_idx]
        scores = self.item_factors @ user_vec

        scored = [
            (self.property_ids[i], float(scores[i]))
            for i in range(len(self.property_ids))
            if self.property_ids[i] not in exclude_ids
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_n]

    def get_user_factor(self, user_id: str) -> Optional[np.ndarray]:
        if not self._is_fitted or user_id not in self.user_ids:
            return None
        u_idx = self.user_ids.index(user_id)
        return self.user_factors[u_idx]

    def save(self, path: str) -> None:
        os.makedirs(path, exist_ok=True)
        joblib.dump({
            "user_ids": self.user_ids,
            "property_ids": self.property_ids,
            "user_factors": self.user_factors,
            "item_factors": self.item_factors,
        }, os.path.join(path, "cf_model.joblib"))
        logger.info(f"CollaborativeFilteringEngine saved to {path}")

    def load(self, path: str) -> None:
        model_file = os.path.join(path, "cf_model.joblib")
        if os.path.exists(model_file):
            data = joblib.load(model_file)
            self.user_ids = data["user_ids"]
            self.property_ids = data["property_ids"]
            self.user_factors = data["user_factors"]
            self.item_factors = data["item_factors"]
            self._is_fitted = True
            logger.info(f"CollaborativeFilteringEngine loaded from {path}.")


class HybridRecommendationEngine:
    """Combines content-based + collaborative + location-aware scoring."""

    def __init__(self):
        self.content_engine = ContentBasedEngine()
        self.cf_engine = CollaborativeFilteringEngine()
        self._load_models()

    def _load_models(self):
        self.content_engine.load(settings.MODEL_DIR)
        self.cf_engine.load(settings.MODEL_DIR)

    def save_models(self):
        self.content_engine.save(settings.MODEL_DIR)
        self.cf_engine.save(settings.MODEL_DIR)

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Compute great-circle distance in km."""
        R = 6371
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def _location_score(
        self,
        property_dict: Dict[str, Any],
        ref_lat: Optional[float],
        ref_lon: Optional[float],
        max_km: float = 50.0,
    ) -> float:
        if ref_lat is None or ref_lon is None:
            return 0.5
        lat = property_dict.get("latitude")
        lon = property_dict.get("longitude")
        if lat is None or lon is None:
            return 0.5
        dist = self._haversine_distance(ref_lat, ref_lon, lat, lon)
        return max(0.0, 1.0 - dist / max_km)

    def _price_score(
        self,
        property_dict: Dict[str, Any],
        min_price: Optional[float],
        max_price: Optional[float],
    ) -> float:
        price = property_dict.get("price")
        if price is None:
            return 0.5
        if min_price is not None and price < min_price:
            return 0.0
        if max_price is not None and price > max_price:
            return 0.0
        if min_price is not None and max_price is not None:
            mid = (min_price + max_price) / 2
            deviation = abs(price - mid) / ((max_price - min_price) / 2 + 1)
            return max(0.0, 1.0 - deviation)
        return 1.0

    def recommend_for_user(
        self,
        user_id: str,
        properties: List[Dict[str, Any]],
        user_preferences: Optional[Dict[str, Any]] = None,
        top_n: int = 10,
        interacted_ids: Optional[List[str]] = None,
    ) -> List[Tuple[str, float, str]]:
        """Return (property_id, score, reason) tuples."""
        interacted_ids = interacted_ids or []
        exclude_ids = set(interacted_ids)
        property_map = {p["id"]: p for p in properties}
        all_ids = list(property_map.keys())

        content_weight = settings.CONTENT_WEIGHT
        cf_weight = settings.COLLABORATIVE_WEIGHT
        location_weight = settings.LOCATION_WEIGHT

        # --- Content-based scores ---
        content_scores: Dict[str, float] = {}
        if user_preferences and user_preferences.get("preference_vector") is not None:
            user_vec = np.array(user_preferences["preference_vector"], dtype=np.float32)
            for pid, score in self.content_engine.get_user_content_recommendations(user_vec, top_n=len(all_ids), exclude_ids=list(exclude_ids)):
                content_scores[pid] = score

        # --- Collaborative filtering scores ---
        cf_scores: Dict[str, float] = {}
        for pid, score in self.cf_engine.recommend_for_user(user_id, top_n=len(all_ids), exclude_ids=list(exclude_ids)):
            cf_scores[pid] = score

        # --- Location & price scores ---
        ref_lat = user_preferences.get("ref_lat") if user_preferences else None
        ref_lon = user_preferences.get("ref_lon") if user_preferences else None
        min_price = user_preferences.get("min_price") if user_preferences else None
        max_price = user_preferences.get("max_price") if user_preferences else None

        # --- Determine strategy for reason tag ---
        has_cf = bool(cf_scores)
        has_content = bool(content_scores)

        # Normalise scores to [0, 1]
        def _normalise(d: Dict[str, float]) -> Dict[str, float]:
            if not d:
                return d
            min_v, max_v = min(d.values()), max(d.values())
            rng = max_v - min_v
            if rng == 0:
                return {k: 0.5 for k in d}
            return {k: (v - min_v) / rng for k, v in d.items()}

        content_scores = _normalise(content_scores)
        cf_scores = _normalise(cf_scores)

        combined: Dict[str, float] = {}
        for pid in all_ids:
            if pid in exclude_ids:
                continue
            prop = property_map.get(pid, {})
            cs = content_scores.get(pid, 0.0)
            cfs = cf_scores.get(pid, 0.0)
            ls = self._location_score(prop, ref_lat, ref_lon)
            ps = self._price_score(prop, min_price, max_price)

            # Adjust weights when one component is missing
            if not has_cf:
                final = cs * (content_weight + cf_weight) + ls * location_weight
            elif not has_content:
                final = cfs * (content_weight + cf_weight) + ls * location_weight
            else:
                final = cs * content_weight + cfs * cf_weight + ls * location_weight

            final *= ps  # penalise out-of-range prices
            combined[pid] = final

        ranked = sorted(combined.items(), key=lambda x: x[1], reverse=True)[:top_n]

        results = []
        for pid, score in ranked:
            if has_cf and has_content:
                reason = "hybrid"
            elif has_cf:
                reason = "collaborative"
            else:
                reason = "content-based"
            results.append((pid, score, reason))

        return results

    def similar_properties(
        self, property_id: str, top_n: int = 10, exclude_ids: Optional[List[str]] = None
    ) -> List[Tuple[str, float, str]]:
        results = self.content_engine.get_similar_properties(property_id, top_n=top_n, exclude_ids=exclude_ids)
        return [(pid, score, "content-similarity") for pid, score in results]

    def train(
        self,
        properties: List[Dict[str, Any]],
        feature_matrix: np.ndarray,
        interactions: List[Dict[str, Any]],
        user_ids: List[str],
        property_ids: List[str],
        interaction_matrix: np.ndarray,
    ) -> None:
        logger.info("Training HybridRecommendationEngine...")
        self.content_engine.fit(property_ids, feature_matrix)
        if len(user_ids) >= 2 and len(property_ids) >= 2:
            self.cf_engine.fit(user_ids, property_ids, interaction_matrix)
        self.save_models()
        logger.info("Training complete.")


# Singleton
recommendation_engine = HybridRecommendationEngine()
