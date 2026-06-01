import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import PageWrapper from "../components/layout/PageWrapper";
import {
  activateCameraSource,
  createCameraSource,
  deleteCameraSource,
  getCameraHealthLogs,
  getCameraSources,
  testCameraSource,
  updateCameraSource,
} from "../services/cameraService";

const emptyForm = {
  name: "",
  source_type: "rtsp",
  source_value: "",
  username: "",
  password_ref: "",
  is_enabled: true,
};

function CCTVSetup() {
  useAuth();
  const [cameraSources, setCameraSources] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraMessage, setCameraMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [cameraForm, setCameraForm] = useState(emptyForm);

  const loadCameraSources = async () => {
    try {
      setCameraLoading(true);
      setCameraError("");
      const rows = await getCameraSources();
      setCameraSources(rows || []);
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to load CCTV sources.");
    } finally {
      setCameraLoading(false);
    }
  };

  const loadHealthLogs = async () => {
    try {
      const rows = await getCameraHealthLogs(20);
      setHealthLogs(rows || []);
    } catch {
      setHealthLogs([]);
    }
  };

  useEffect(() => {
    loadCameraSources();
    loadHealthLogs();
  }, []);

  const updateCameraForm = (key, value) => {
    setCameraForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setCameraForm(emptyForm);
  };

  const handleSave = async () => {
    try {
      setCameraError("");
      setCameraMessage("");
      if (editingId) {
        await updateCameraSource(editingId, cameraForm);
        setCameraMessage("Camera source updated.");
      } else {
        await createCameraSource(cameraForm);
        setCameraMessage("Camera source created.");
      }
      resetForm();
      await loadCameraSources();
      await loadHealthLogs();
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to save camera source.");
    }
  };

  const handleTest = async () => {
    try {
      setCameraError("");
      setCameraMessage("");
      const response = await testCameraSource(cameraForm);
      setCameraMessage(response?.message || "Camera test successful.");
    } catch (error) {
      setCameraError(error?.response?.data?.error || error?.response?.data?.message || "Camera test failed.");
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setCameraForm({
      name: row.name || "",
      source_type: row.source_type || "rtsp",
      source_value: row.source_value || "",
      username: row.username || "",
      password_ref: row.password_ref || "",
      is_enabled: Boolean(row.is_enabled),
    });
  };

  const handleActivate = async (id) => {
    try {
      setCameraError("");
      setCameraMessage("");
      await activateCameraSource(id);
      setCameraMessage("Camera source activated.");
      await loadCameraSources();
      await loadHealthLogs();
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to activate camera source.");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete camera source "${row.name}"?`)) return;
    try {
      setCameraError("");
      setCameraMessage("");
      await deleteCameraSource(row.id);
      if (editingId === row.id) resetForm();
      setCameraMessage("Camera source deleted.");
      await loadCameraSources();
      await loadHealthLogs();
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to delete camera source.");
    }
  };

  return (
    <PageWrapper
      title="CCTV Setup"
      subtitle="Configure RTSP/HTTP/USB camera sources for future production deployment"
      actions={<button className="btn btn-secondary btn-sm" onClick={loadCameraSources}>Refresh</button>}
    >
      <div style={s.card}>
        <div style={s.formGrid}>
          <input className="input" placeholder="Source name (e.g. Main Gate CCTV)" value={cameraForm.name} onChange={(e) => updateCameraForm("name", e.target.value)} />
          <select className="input" value={cameraForm.source_type} onChange={(e) => updateCameraForm("source_type", e.target.value)}>
            <option value="rtsp">RTSP</option>
            <option value="http">HTTP</option>
            <option value="usb">USB</option>
          </select>
          <input className="input" style={{ gridColumn: "1 / -1" }} placeholder="Source value (rtsp://... or http://... or USB index 0)" value={cameraForm.source_value} onChange={(e) => updateCameraForm("source_value", e.target.value)} />
          <input className="input" placeholder="Username (optional)" value={cameraForm.username} onChange={(e) => updateCameraForm("username", e.target.value)} />
          <input className="input" placeholder="Password reference (optional)" value={cameraForm.password_ref} onChange={(e) => updateCameraForm("password_ref", e.target.value)} />
          <label style={s.checkboxRow}>
            <input type="checkbox" checked={cameraForm.is_enabled} onChange={(e) => updateCameraForm("is_enabled", e.target.checked)} />
            Enabled
          </label>
        </div>
        <div style={s.actionsRow}>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>{editingId ? "Update Source" : "Add Source"}</button>
          <button className="btn btn-secondary btn-sm" onClick={handleTest}>Test Connection</button>
          {editingId ? <button className="btn btn-secondary btn-sm" onClick={resetForm}>Cancel Edit</button> : null}
        </div>
        {cameraError ? <p style={s.error}>{cameraError}</p> : null}
        {cameraMessage ? <p style={s.success}>{cameraMessage}</p> : null}
      </div>

      <div style={s.card}>
        {cameraLoading ? (
          <p style={s.muted}>Loading sources...</p>
        ) : cameraSources.length === 0 ? (
          <p style={s.muted}>No camera sources configured yet.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Name</th>
                <th style={s.th}>Type</th>
                <th style={s.th}>Value</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cameraSources.map((row) => (
                <tr key={row.id}>
                  <td style={s.td}>{row.name}</td>
                  <td style={s.td}>{String(row.source_type || "").toUpperCase()}</td>
                  <td style={s.td}>{row.source_value}</td>
                  <td style={s.td}>{row.is_active ? "Active" : row.is_enabled ? "Ready" : "Disabled"}</td>
                  <td style={s.td}>
                    <div style={s.rowActions}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(row)}>Edit</button>
                      {!row.is_active ? <button className="btn btn-primary btn-sm" onClick={() => handleActivate(row.id)}>Activate</button> : null}
                      {!row.is_active ? <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row)}>Delete</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={s.card}>
        <p style={s.heading}>Recent Camera Health</p>
        {healthLogs.length === 0 ? (
          <p style={s.muted}>No health logs yet.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Time</th>
                <th style={s.th}>Source</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Message</th>
              </tr>
            </thead>
            <tbody>
              {healthLogs.map((row) => (
                <tr key={row.id}>
                  <td style={s.td}>{row.checked_at ? new Date(row.checked_at).toLocaleString("en-IN") : "-"}</td>
                  <td style={s.td}>{row.source_name || "Default USB"}</td>
                  <td style={s.td}>{String(row.status || "").toUpperCase()}</td>
                  <td style={s.td}>{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
}

export default CCTVSetup;

const s = {
  card: { background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" },
  checkboxRow: { display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "13px" },
  actionsRow: { display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" },
  error: { color: "var(--danger)", margin: "10px 0 0" },
  success: { color: "var(--accent)", margin: "10px 0 0" },
  muted: { margin: 0, color: "var(--text-muted)" },
  heading: { margin: "0 0 10px", fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" },
  table: { width: "100%", borderCollapse: "collapse", border: "1px solid var(--border)" },
  th: { textAlign: "left", fontSize: "12px", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", padding: "8px 10px" },
  td: { fontSize: "13px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", padding: "8px 10px" },
  rowActions: { display: "flex", gap: "6px", flexWrap: "wrap" },
};
