import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

const isAuthRequest = (url = "") =>
  /\/auth\/(login|register|refresh-token|logout|verify-email|forgot-password|verify-reset-otp|reset-password)/.test(
    url,
  );

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retry ||
      isAuthRequest(request.url)
    ) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshPromise ??= refreshClient
        .post("/auth/refresh-token")
        .finally(() => {
          refreshPromise = null;
        });
      await refreshPromise;
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
