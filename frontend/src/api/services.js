import { apiClient } from "./client";

export const getAllServices = () =>
  apiClient.get("/ServiceApis/getAllServices").then((res) => res.data);

export const getServiceById = (id) =>
  apiClient.get(`/ServiceApis/GetById/${id}`).then((res) => res.data);

export const getServicesByType = (serviceType) =>
  apiClient
    .get(`/ServiceApis/GetServiceByType/${serviceType}`)
    .then((res) => res.data);

export const getServicesByProperty = (propertyId) =>
  apiClient
    .get(`/ServiceApis/GetServicesByProperty/${propertyId}`)
    .then((res) => res.data);

export const addService = (dto) =>
  apiClient.post("/ServiceApis/AddService", dto).then((res) => res.data);

export const updateService = (id, dto) =>
  apiClient
    .put(`/ServiceApis/UpdateService/${id}`, { ...dto, serviceID: id })
    .then((res) => res.data);

export const deleteService = (id) =>
  apiClient.delete(`/ServiceApis/DeleteService/${id}`).then((res) => res.data);
