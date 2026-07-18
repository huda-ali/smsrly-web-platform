import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,

      setAuth: (authData) =>
        set({
          role: authData.role,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "smsrly_auth",
    },
  ),
);

export const getAccessToken = () => useAuthStore.getState().accessToken;

export const clearAuth = () => useAuthStore.getState().clearAuth();

export const getRefreshToken = () => useAuthStore.getState().refreshToken;

export const setAuthTokens = ({ accessToken, refreshToken }) => {
  const state = useAuthStore.getState();
  state.setAuth({
    accessToken,
    refreshToken,
    role: state.role,
  });
};
