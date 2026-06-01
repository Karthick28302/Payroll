export const ADMIN_TOKEN_KEY = "admin_token";
export const ADMIN_USER_KEY = "admin_user";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminUser() {
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdminSessionValid() {
  const token = getAdminToken();
  const admin = getAdminUser();
  return Boolean(token && admin?.role === "admin");
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem("isAdmin");
}
