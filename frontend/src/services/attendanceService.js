import API from "./api";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export async function getAttendance(params = {}) {
  const res = await API.get("/attendance", { params });
  return res.data;
}

export async function getAttendanceStats() {
  const res = await API.get("/attendance/stats");
  return res.data;
}

export async function getAttendanceAnalytics(params = {}) {
  const res = await API.get("/attendance/analytics", { params });
  return res.data;
}

export function exportUrl(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${API_URL}/export?${qs}` : `${API_URL}/export`;
}
