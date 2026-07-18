import { apiClient } from "./client";

export const login = (email, password) =>
  apiClient.post("/Auth/login", { email, password }).then((res) => res.data);

export const registerTenant = (payload) =>
  apiClient.post("/Auth/register/tenant", payload).then((res) => res.data);

export const registerOwner = (payload) =>
  apiClient.post("/Auth/register/owner", payload).then((res) => res.data);

export const registerAdmin = (payload) =>
  apiClient.post("/Auth/register/admin", payload).then((res) => res.data);

export const refreshAccessToken = (refreshToken) =>
  apiClient
    .post("/Auth/refresh", { refreshToken }, { _isRefreshCall: true })
    .then((res) => res.data);
