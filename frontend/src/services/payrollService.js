import API from "./api";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export async function getPayrollSummary(params = {}) {
  const { data } = await API.get("/payroll/summary", { params });
  return data;
}

export function payrollExportUrl(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `${API_URL}/payroll/export?${qs}` : `${API_URL}/payroll/export`;
}

export async function markPayrollPaid(payload) {
  const { data } = await API.post("/payroll/mark-paid", payload);
  return data;
}

export async function markPayrollPending(payload) {
  const { data } = await API.post("/payroll/mark-pending", payload);
  return data;
}
