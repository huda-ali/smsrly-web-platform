import { apiClient } from "./client";

export const getAllTenants = () =>
  apiClient.get("/TenantApis/GetAllTenants").then((res) => res.data);

export const getTenantById = (id) =>
  apiClient.get(`/TenantApis/GetTenantById/${id}`).then((res) => res.data);

export const getTenantReviews = (tenantId) =>
  apiClient
    .get(`/TenantApis/GetTenantReviews/${tenantId}`)
    .then((res) => res.data);

export const getTenantMessages = (tenantId) =>
  apiClient
    .get(`/TenantApis/GetTenantMessages/${tenantId}`)
    .then((res) => res.data);

export const addTenant = (dto) =>
  apiClient.post("/TenantApis/AddTenant", dto).then((res) => res.data);

export const updateTenant = (id, dto) =>
  apiClient
    .put(`/TenantApis/UpdateTenant/${id}`, { ...dto, usserId: id })
    .then((res) => res.data);

export const deleteTenant = (id) =>
  apiClient.delete(`/TenantApis/DeleteTenant/${id}`).then((res) => res.data);
