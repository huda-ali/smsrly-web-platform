import { apiClient } from "./client";

export const getAllPreferences = () =>
  apiClient.get("/Preferences/GetAllPreferences").then((res) => res.data);

export const getPreferenceById = (id) =>
  apiClient.get(`/Preferences/GetPreferenceById/${id}`).then((res) => res.data);

export const getPreferenceByTenant = (tenantId) =>
  apiClient
    .get(`/Preferences/GetPreferenceByTenant/${tenantId}`)
    .then((res) => res.data);

export const getPreferencesByType = (type) =>
  apiClient
    .get(`/Preferences/GetPreferencesByType/${type}`)
    .then((res) => res.data);

export const getPreferencesByPriceRange = (minPrice, maxPrice) =>
  apiClient
    .get("/Preferences/GetPreferencesByPriceRange", {
      params: { minPrice, maxPrice },
    })
    .then((res) => res.data);

export const getPreferencesBySoloOrShared = (value) =>
  apiClient
    .get(`/Preferences/GetPreferencesBySoloOrShared/${value}`)
    .then((res) => res.data);

export const addPreference = (dto) =>
  apiClient.post("/Preferences/AddPreference", dto).then((res) => res.data);

export const updatePreference = (id, dto) =>
  apiClient
    .put(`/Preferences/UpdatePreference/${id}`, {
      ...dto,
      preferencesID: id,
    })
    .then((res) => res.data);

export const deletePreference = (id) =>
  apiClient
    .delete(`/Preferences/DeletePreference/${id}`)
    .then((res) => res.data);
