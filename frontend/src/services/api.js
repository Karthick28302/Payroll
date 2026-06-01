import axios from "axios";
import { clearAdminSession, getAdminToken } from "../utils/auth";

/**
 * Central Axios instance.
 * Base URL is read from .env so you never hardcode 127.0.0.1:5000 in components.
 *
 * Add REACT_APP_API_URL=http://127.0.0.1:5000 to frontend/.env
 */
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:5000",
});

API.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      clearAdminSession();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default API;
