import { apiClient } from "./client";

export const fetchRecommendations = (topN = 10) =>
  apiClient.get(`/Recommendation?topN=${topN}`).then((res) => res.data);

export const recordInteraction = (propertyId, interactionType, rating) =>
  apiClient.post("/Recommendation/interact", {
    propertyId,
    interactionType,
    rating,
  });

export const fetchSimilarProperties = (propertyId, topN = 10) =>
  apiClient
    .get(`/Recommendation/similar/${propertyId}?topN=${topN}`)
    .then((res) => res.data);

export const updatePreferences = ({
  preferredCities,
  minPrice,
  maxPrice,
  minBedrooms,
} = {}) =>
  apiClient
    .post("/Recommendation/preferences", {
      preferredCities,
      minPrice,
      maxPrice,
      minBedrooms,
    })
    .then((res) => res.data);
