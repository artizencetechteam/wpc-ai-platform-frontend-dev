"use client";

import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from "axios";

/* ============================================
   COOKIE HELPERS
============================================ */

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${expires.toUTCString()};path=/`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
};

const getSessionToken = (): string | null => {
  return getCookie("session-token");
};

/* ============================================
   TOKEN CHECK
============================================ */

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;

    return Date.now() >= exp - 10000;
  } catch {
    return true;
  }
};

/* ============================================
   AXIOS INSTANCE
============================================ */

const clientApi = axios.create({
  baseURL: "http://37.27.113.235:6767",   // 👈 YOUR API SERVER
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

/* ============================================
   PUBLIC ROUTES (No redirect)
============================================ */

const isPublicRoute = () => {
  if (typeof window === "undefined") return false;

  const path = window.location.pathname;

  const publicRoutes = [
    "/welcome",
    "/welcome/forgot-password",
    "/welcome/change-password"
  ];

  return publicRoutes.some(route => path.startsWith(route));
};

/* ============================================
   REQUEST INTERCEPTOR
============================================ */

clientApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {

    let accessToken = getCookie("access-token");

    if (!accessToken || isTokenExpired(accessToken)) {

      const refreshToken = getCookie("refresh-token");

      if (refreshToken) {

        try {

          const refreshResponse = await axios.post(
            "http://37.27.113.235:6767/api/auth/refresh/",
            { refresh: refreshToken }
          );

          const newAccessToken = refreshResponse.data.access;

          setCookie("access-token", newAccessToken);

          accessToken = newAccessToken;

        } catch (error) {

          deleteCookie("access-token");
          deleteCookie("refresh-token");
          deleteCookie("session-token");

          if (!isPublicRoute()) {
            window.location.href = "/welcome";
          }

          return Promise.reject(error);
        }

      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const sessionToken = getSessionToken();
    if (sessionToken) {
      config.headers["X-Session-Token"] = sessionToken;
    }

    return config;
  },
  error => Promise.reject(error)
);

/* ============================================
   RESPONSE INTERCEPTOR
============================================ */

clientApi.interceptors.response.use(
  (response: AxiosResponse) => response,

  async (error: AxiosError<any>) => {

    const originalRequest: any = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {

      originalRequest._retry = true;

      try {

        const refreshToken = getCookie("refresh-token");

        if (!refreshToken) throw new Error("No refresh token");

        const refreshResponse = await axios.post(
          "http://37.27.113.235:6767/api/auth/refresh/",
          { refresh: refreshToken }
        );

        const newAccessToken = refreshResponse.data.access;

        setCookie("access-token", newAccessToken);

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return clientApi(originalRequest);

      } catch (refreshError) {

        deleteCookie("access-token");
        deleteCookie("refresh-token");
        deleteCookie("session-token");

        if (!isPublicRoute()) {
          window.location.href = "/welcome";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default clientApi;