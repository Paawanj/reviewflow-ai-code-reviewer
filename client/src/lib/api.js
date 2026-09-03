import axios from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 180000,
});
let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthEndpoint = request?.url?.startsWith("/auth/");

    if (error.response?.status !== 401 || request?._retried || isAuthEndpoint) {
      return Promise.reject(error);
    }

    request._retried = true;

    try {
      refreshPromise ??= api.post("/auth/refresh").then((response) => response.data);
      const session = await refreshPromise;
      setAccessToken(session.accessToken);
      request.headers.Authorization = `Bearer ${session.accessToken}`;
      return api(request);
    } catch (refreshError) {
      clearAccessToken();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export default api;
