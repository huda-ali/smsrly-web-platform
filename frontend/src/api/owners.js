import { apiClient } from "./client";

export const getAllOwners = () =>
  apiClient.get("/OwnerApis/GetAllOwners").then((res) => res.data);

export const getOwnerById = (id) =>
  apiClient.get(`/OwnerApis/GetOwnerById/${id}`).then((res) => res.data);

export const getOwnerProperties = (ownerId) =>
  apiClient
    .get(`/OwnerApis/GetOwnerProperties/${ownerId}`)
    .then((res) => res.data);

export const getOwnerMessages = (ownerId) =>
  apiClient
    .get(`/OwnerApis/GetOwnerMessages/${ownerId}`)
    .then((res) => res.data);

export const addOwner = (dto) =>
  apiClient.post("/OwnerApis/AddOwner", dto).then((res) => res.data);

export const updateOwner = (id, dto) =>
  apiClient
    .put("/OwnerApis/UpdateOwner", { ...dto, usserId: id }, { params: { id } })
    .then((res) => res.data);

export const deleteOwner = (id) =>
  apiClient.delete(`/OwnerApis/DeleteOwner/${id}`).then((res) => res.data);
