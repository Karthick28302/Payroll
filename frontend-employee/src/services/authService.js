import API from "./api";

// POST /auth/login  — payload: { identifier, password }
// Change field names here if your backend expects different keys
// e.g. { username, password } or { employee_code, password }
export const employeeLogin = async (payload) => {
  const { data } = await API.post("/auth/login", payload);
  return data.data;
};

export const getCurrentEmployee = async () => {
  const { data } = await API.get("/auth/me");
  return data.data.user;
};