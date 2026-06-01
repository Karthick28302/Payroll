import axios from "axios";

const TOKEN_KEY = "employee_token";
const EMPLOYEE_KEY = "employee_user";

const API = axios.create({
  baseURL: process.env.REACT_APP_EMPLOYEE_API_URL || "http://localhost:5001/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";
    const isLoginRequest = requestUrl.includes("/auth/login");

    if ((status === 401 || status === 403) && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMPLOYEE_KEY);
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default API;
