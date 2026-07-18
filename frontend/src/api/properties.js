import { apiClient } from "./client";

export const getAllProperties = () =>
  apiClient.get("/PropertyApis/GetAllProperties").then((res) => res.data);

export const getPropertyById = (id) =>
  apiClient.get(`/PropertyApis/GetPropertyById/${id}`).then((res) => res.data);

export const getPropertiesByPriceRange = (minPrice, maxPrice) =>
  apiClient
    .get("/PropertyApis/GetByPriceRange", { params: { minPrice, maxPrice } })
    .then((res) => res.data);

export const getPropertiesByRooms = (rooms) =>
  apiClient.get(`/PropertyApis/GetByRooms/${rooms}`).then((res) => res.data);

export const getPropertyReviews = (propertyId) =>
  apiClient
    .get(`/PropertyApis/GetPropertyReviews/${propertyId}`)
    .then((res) => res.data);

export const getPropertyServices = (propertyId) =>
  apiClient
    .get(`/PropertyApis/GetPropertyServices/${propertyId}`)
    .then((res) => res.data);

export const addProperty = (dto) =>
  apiClient.post("/PropertyApis/AddProperty", dto).then((res) => res.data);

export const updateProperty = (id, dto) =>
  apiClient
    .put(`/PropertyApis/UpdateProperty/${id}`, { ...dto, properyID: id })
    .then((res) => res.data);

export const deleteProperty = (id) =>
  apiClient
    .delete(`/PropertyApis/DeleteProperty/${id}`)
    .then((res) => res.data);
