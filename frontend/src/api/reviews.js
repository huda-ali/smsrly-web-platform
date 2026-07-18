import { apiClient } from "./client";

export const getAllReviews = () =>
  apiClient.get("/Review/getAllReviews").then((res) => res.data);

export const getReviewById = (id) =>
  apiClient.get(`/Review/GetReviewBy${id}`).then((res) => res.data);

export const getPropertyReviews = (propertyId) =>
  apiClient
    .get(`/Review/GetpropertyReviews/${propertyId}`)
    .then((res) => res.data);

export const getTenantReviews = (tenantId) =>
  apiClient.get(`/Review/GettenantReviews/${tenantId}`).then((res) => res.data);

export const addReview = (dto) =>
  apiClient.post("/Review/AddReview", dto).then((res) => res.data);

export const updateReview = (id, dto) =>
  apiClient
    .put(`/Review/UpdateReview/${id}`, { ...dto, reviewID: id })
    .then((res) => res.data);

export const deleteReview = (id) =>
  apiClient.delete(`/Review/${id}`).then((res) => res.data);
