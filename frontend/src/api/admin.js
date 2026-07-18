import { apiClient } from "./client";

export const getAllAdminProperties = () =>
  apiClient.get("/AdminApis/properties").then((res) => res.data);

export const getAllAdmins = () =>
  apiClient.get("/AdminApis/GetAllAdmins").then((res) => res.data);

export const getAdminById = (id) =>
  apiClient.get(`/AdminApis/GetAdmin${id}`).then((res) => res.data);

export const addAdmin = (dto) =>
  apiClient.post("/AdminApis/AddAdmin", dto).then((res) => res.data);

export const updateAdmin = (id, dto) =>
  apiClient.put(`/AdminApis/UpdateAdmin${id}`, dto).then((res) => res.data);

export const deleteAdmin = (id) =>
  apiClient.delete(`/AdminApis/DeleteAdmin/${id}`).then((res) => res.data);


export const startScrape = (dto) =>
  apiClient.post("/admin/ml/scrape", dto).then((res) => res.data);

export const getScrapeStatus = (jobId) =>
  apiClient.get(`/admin/ml/scrape/status/${jobId}`).then((res) => res.data);

export const triggerTraining = (dto) =>
  apiClient.post("/admin/ml/train-model", dto).then((res) => res.data);
