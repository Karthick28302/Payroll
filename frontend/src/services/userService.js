import API from "./api";

export async function registerFace(name, image, employee = {}) {
  const res = await API.post("/register", {
    name,
    image,
    employeeCode: employee.employeeCode || "",
    email: employee.email || "",
    password: employee.password || "",
    department: employee.department || "",
    designation: employee.designation || "",
    phone: employee.phone || "",
    address: employee.address || "",
  });
  return res.data;
}

export async function retryEmployeeSync(payload) {
  const res = await API.post("/sync-employee", payload);
  return res.data;
}

export async function getUsers() {
  const res = await API.get("/users");
  return res.data;
}

export async function getUserDetails(userId) {
  const res = await API.get(`/users/${userId}`);
  return res.data;
}

export async function updateCompensation(userId, payload) {
  const res = await API.put(`/users/${userId}/compensation`, payload);
  return res.data;
}

export async function deleteUser(userId) {
  const res = await API.delete(`/users/${userId}`);
  return res.data;
}

export async function clearFaceEncodings() {
  const res = await API.post("/admin/encodings/clear");
  return res.data;
}

export async function resetAttendanceRecords() {
  const res = await API.post("/admin/attendance/reset");
  return res.data;
}
