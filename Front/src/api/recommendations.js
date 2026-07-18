import { apiClient } from "./client";

export const fetchRecommendations = (topN = 10) =>
  apiClient
    .get(`/Recommendation?topN=${topN}`)
    .then((res) => res.data);

export const recordInteraction = (
  propertyId,
  interactionType,
  rating
) =>
  apiClient.post("/Recommendation/interact", {
    propertyId,
    interactionType,
    rating,
  });
