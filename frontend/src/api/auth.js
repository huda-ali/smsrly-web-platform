import { apiClient } from "./client";

export const login = (Email, Password) =>
  apiClient
    .post("/Auth/login", { Email, Password }, { _silenceErrorToast: true })
    .then((res) => res.data);

export const registerTenant = (payload) =>
  apiClient
    .post("/Auth/register/tenant", payload, { _silenceErrorToast: true })
    .then((res) => res.data);

export const registerOwner = (payload) =>
  apiClient
    .post("/Auth/register/owner", payload, { _silenceErrorToast: true })
    .then((res) => res.data);

export const registerAdmin = (payload) =>
  apiClient
    .post("/Auth/register/admin", payload, { _silenceErrorToast: true })
    .then((res) => res.data);

export const refreshAccessToken = (refreshToken) =>
  apiClient
    .post("/Auth/refresh", { refreshToken }, { _isRefreshCall: true })
    .then((res) => res.data);
