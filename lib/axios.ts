"use client";

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Helper to read a cookie by name
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};


const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
};

// Helper to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp - 10000; // Refresh 10 seconds before actual expiry
  } catch (error) {
    return true;
  }
};

const clientApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://wpcapitest.careerbandhu.in/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Check access token BEFORE making request
clientApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let accessToken = getCookie("access-token");

    // Check if access token is missing or expired
    if (!accessToken || isTokenExpired(accessToken)) {
      console.log(" Access token missing or expired, refreshing...");

      const refreshToken = getCookie("refresh-token");

      if (refreshToken) {
        try {
          // Call refresh endpoint to get new access token
          const refreshResponse = await axios.post(
            "https://wpcapitest.careerbandhu.in/api/auth/refresh/",
            { refresh: refreshToken },
            { 
              withCredentials: true,
              headers: { "Content-Type": "application/json" }
            }
          );

          // Get and store new access token
          const newAccessToken = refreshResponse.data.access;
          setCookie("access-token", newAccessToken);
          accessToken = newAccessToken;

          console.log(" Access token refreshed successfully");
        } catch (error) {
          console.error(" Failed to refresh token:", error);
          
          // Clear all cookies
          document.cookie = "access-token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
          document.cookie = "refresh-token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
          document.cookie = "user-info=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
          
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/welcome';
          }
          
          return Promise.reject(error);
        }
      } else {
        console.error(" No refresh token available");
        
        // Redirect to login if no refresh token
        if (typeof window !== 'undefined') {
          window.location.href = '/welcome';
        }
        
        return Promise.reject(new Error("No refresh token available"));
      }
    }

    // Add access token to request headers
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for 401 (backup logic)
clientApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log(" Got 401, attempting refresh...");
        
        // Get the refresh token from cookie
        const refreshToken = getCookie("refresh-token");
        
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const refreshResponse = await axios.post(
          "https://wpcapi.careerbandhu.in/api/auth/refresh/",
          { refresh: refreshToken },
          { withCredentials: true }
        );

        // Set the new access token in cookie
        const newAccessToken = refreshResponse.data.access;
        setCookie("access-token", newAccessToken);

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        console.log(" Retrying request with new token");
        return clientApi(originalRequest);
      } catch (refreshError) {
        console.error(" Refresh failed in 401 handler");
        
        
        document.cookie = "access-token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
        document.cookie = "refresh-token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
        document.cookie = "user-info=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
        
        if (typeof window !== 'undefined') {
          window.location.href = '/welcome';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default clientApi;
// test
