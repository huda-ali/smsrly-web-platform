import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuth,
  useAuthStore,
} from "../store/authStore";
import { toastBus } from "../utils/toastBus";

export const apiClient = axios.create({
  baseURL: 'http://localhost:5089/api',
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function flushQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

function forceLogout() {
  clearAuth();
  toastBus.error("Your session has expired. Please sign in again.");
  window.location.href = "/signin";
}

function firstValidationError(data) {
  if (!data?.errors || typeof data.errors !== "object") return null;
  for (const key of Object.keys(data.errors)) {
    const messages = data.errors[key];
    if (Array.isArray(messages) && messages.length > 0) return messages[0];
  }
  return null;
}

export function describeError(error) {
  if (!error.response) {
    return "Network error — please check your connection and try again.";
  }
  const { status, data } = error.response;
  const serverMessage =
    (typeof data === "string" && data) ||
    data?.message ||
    firstValidationError(data) ||
    data?.title;
  if (serverMessage) return serverMessage;
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "The requested resource wasn't found.";
  if (status >= 500)
    return "Something went wrong on the server. Please try again.";
  return "Something went wrong with that request.";
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (config?._isRefreshCall) {
      return Promise.reject(error);
    }

    const isUnauthorized = response?.status === 401;
    const alreadyRetried = config?._retriedAfterRefresh;
    const refreshToken = getRefreshToken();
    const hadAuthHeader = Boolean(config?.headers?.Authorization);

    if (isUnauthorized && hadAuthHeader && !alreadyRetried && refreshToken) {
      config._retriedAfterRefresh = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: (token) => {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(config));
            },
            reject,
          });
        });
      }

      isRefreshing = true;
      try {
        const { refreshAccessToken } = await import("./auth");
        const data = await refreshAccessToken(refreshToken);

        setAuthTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? refreshToken,
        });

        flushQueue(null, data.accessToken);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(config);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (isUnauthorized && hadAuthHeader) {
      forceLogout();
    } else if (!config?._silenceErrorToast) {
      toastBus.error(describeError(error));
    }

    return Promise.reject(error);
  },
);
