import API from "./api";

const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

export function videoFeedUrl(query = "") {
  const token = localStorage.getItem("admin_token");
  const params = new URLSearchParams();
  if (typeof query === "string" && query) {
    const queryParams = new URLSearchParams(query);
    for (const [key, value] of queryParams.entries()) {
      params.set(key, value);
    }
  } else if (query && typeof query === "object") {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
  }
  if (token) {
    params.set("access_token", token);
  }
  const qs = params.toString();
  return qs ? `${API_URL}/video_feed?${qs}` : `${API_URL}/video_feed`;
}

export function cameraStatusUrl() {
  return `${API_URL}/camera/status`;
}

export async function getCameraStatus() {
  const { data } = await API.get("/camera/status");
  return data;
}

export async function getCameraSources() {
  const { data } = await API.get("/camera/sources");
  return data;
}

export async function createCameraSource(payload) {
  const { data } = await API.post("/camera/sources", payload);
  return data;
}

export async function updateCameraSource(sourceId, payload) {
  const { data } = await API.put(`/camera/sources/${sourceId}`, payload);
  return data;
}

export async function activateCameraSource(sourceId) {
  const { data } = await API.post(`/camera/sources/${sourceId}/activate`);
  return data;
}

export async function deleteCameraSource(sourceId) {
  const { data } = await API.delete(`/camera/sources/${sourceId}`);
  return data;
}

export async function testCameraSource(payload) {
  const { data } = await API.post("/camera/sources/test", payload);
  return data;
}

export async function releaseBackendCamera() {
  const { data } = await API.post("/camera/release");
  return data;
}

export async function getCameraHealthLogs(limit = 20) {
  const { data } = await API.get(`/camera/health-logs?limit=${limit}`);
  return data;
}

export async function getCameraRecordings(limit = 50) {
  const { data } = await API.get(`/camera/recordings?limit=${limit}`);
  return data;
}

export async function getRecordingStatus() {
  const { data } = await API.get("/camera/recording/status");
  return data;
}

export async function startRecording() {
  const { data } = await API.post("/camera/recording/start");
  return data;
}

export async function stopRecording() {
  const { data } = await API.post("/camera/recording/stop");
  return data;
}
