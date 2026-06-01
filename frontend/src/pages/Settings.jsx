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
import {
  clearFaceEncodings,
  resetAttendanceRecords,
} from "../services/userService";

/* ── Section wrapper ── */
const Section = ({ title, desc, children }) => (
  <div style={s.section}>
    <div style={s.sectionHead}>
      <div>
        <p style={s.sectionTitle}>{title}</p>
        {desc && <p style={s.sectionDesc}>{desc}</p>}
      </div>
    </div>
    <div style={s.sectionBody}>{children}</div>
  </div>
);

/* ── Setting row ── */
const SettingRow = ({ label, desc, children }) => (
  <div style={s.settingRow}>
    <div style={s.settingInfo}>
      <p style={s.settingLabel}>{label}</p>
      {desc && <p style={s.settingDesc}>{desc}</p>}
    </div>
    <div style={s.settingControl}>{children}</div>
  </div>
);

/* ── Toggle switch ── */
const Toggle = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      ...s.toggle,
      background: checked ? "var(--accent)" : "var(--surface-3)",
    }}
  >
    <span style={{ ...s.toggleThumb, transform: checked ? "translateX(18px)" : "translateX(2px)" }} />
  </button>
);

/* ── Main page ── */
const Settings = () => {
  useAuth();

  const [settings, setSettings] = useState({
    logoutDelay:      5,
    autoRefresh:      true,
    refreshInterval:  5,
    darkMode:         true,
    notifications:    false,
    logUnknown:       false,
    backendUrl:       "http://127.0.0.1:5000",
    tolerance:        0.6,
  });

  const [saved, setSaved] = useState(false);
  const [cameraSources, setCameraSources] = useState([]);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraMessage, setCameraMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [cameraForm, setCameraForm] = useState({
    name: "",
    source_type: "usb",
    source_value: "0",
    username: "",
    password_ref: "",
    is_enabled: true,
  });
  const [healthLogs, setHealthLogs] = useState([]);
  const [dangerLoading, setDangerLoading] = useState("");
  const [dangerMessage, setDangerMessage] = useState("");
  const [dangerError, setDangerError] = useState("");

  const update = (key, val) => setSettings((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const loadCameraSources = async () => {
    try {
      setCameraLoading(true);
      setCameraError("");
      const rows = await getCameraSources();
      setCameraSources(Array.isArray(rows) ? rows : []);
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to load camera sources.");
    } finally {
      setCameraLoading(false);
    }
  };

  const loadHealthLogs = async () => {
    try {
      const rows = await getCameraHealthLogs(20);
      setHealthLogs(Array.isArray(rows) ? rows : []);
    } catch {
      setHealthLogs([]);
    }
  };

  const handleClearEncodings = async () => {
    const confirmed = window.confirm(
      "Clear all saved face encodings? Employees will need to be re-registered."
    );
    if (!confirmed) return;

    setDangerLoading("encodings");
    setDangerError("");
    setDangerMessage("");
    try {
      const data = await clearFaceEncodings();
      setDangerMessage(data?.message || "All face encodings cleared.");
    } catch (error) {
      setDangerError(error?.response?.data?.error || "Failed to clear encodings.");
    } finally {
      setDangerLoading("");
    }
  };

  const handleResetAttendance = async () => {
    const confirmed = window.confirm(
      "Delete all attendance history? This action cannot be undone."
    );
    if (!confirmed) return;

    setDangerLoading("attendance");
    setDangerError("");
    setDangerMessage("");
    try {
      const data = await resetAttendanceRecords();
      const deleted = Number(data?.deleted || 0);
      setDangerMessage(
        deleted > 0
          ? `Deleted ${deleted} attendance record${deleted === 1 ? "" : "s"}.`
          : data?.message || "Attendance records cleared."
      );
    } catch (error) {
      setDangerError(error?.response?.data?.error || "Failed to reset attendance records.");
    } finally {
      setDangerLoading("");
    }
  };

  useEffect(() => {
    loadCameraSources();
    loadHealthLogs();
  }, []);

  const updateCameraForm = (key, value) => {
    setCameraForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetCameraForm = () => {
    setEditingId(null);
    setCameraForm({
      name: "",
      source_type: "usb",
      source_value: "0",
      username: "",
      password_ref: "",
      is_enabled: true,
    });
  };

  const handleCameraSave = async () => {
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
      resetCameraForm();
      await loadCameraSources();
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to save camera source.");
    }
  };

  const handleCameraTest = async () => {
    try {
      setCameraError("");
      setCameraMessage("");
      const response = await testCameraSource(cameraForm);
      setCameraMessage(response?.message || "Camera test successful.");
    } catch (error) {
      setCameraError(error?.response?.data?.error || error?.response?.data?.message || "Camera test failed.");
    }
  };

  const handleCameraEdit = (row) => {
    setEditingId(row.id);
    setCameraForm({
      name: row.name || "",
      source_type: row.source_type || "usb",
      source_value: row.source_value || "",
      username: row.username || "",
      password_ref: row.password_ref || "",
      is_enabled: Boolean(row.is_enabled),
    });
  };

  const handleCameraActivate = async (sourceId) => {
    try {
      setCameraError("");
      setCameraMessage("");
      await activateCameraSource(sourceId);
      setCameraMessage("Camera source activated.");
      await loadCameraSources();
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to activate camera source.");
    }
  };

  const handleCameraDelete = async (row) => {
    const confirmed = window.confirm(`Delete camera source "${row.name}"?`);
    if (!confirmed) return;

    try {
      setCameraError("");
      setCameraMessage("");
      await deleteCameraSource(row.id);
      if (editingId === row.id) {
        resetCameraForm();
      }
      setCameraMessage("Camera source deleted.");
      await loadCameraSources();
    } catch (error) {
      setCameraError(error?.response?.data?.error || "Failed to delete camera source.");
    }
  };

  const safeCameraSources = Array.isArray(cameraSources) ? cameraSources : [];
  const safeHealthLogs = Array.isArray(healthLogs) ? healthLogs : [];

  return (
    <PageWrapper
      title="Settings"
      subtitle="Configure system behaviour and preferences"
      actions={
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          {saved ? "✓ Saved" : "Save Changes"}
        </button>
      }
    >

      {saved && (
        <div style={s.savedBanner}>
          <span>✓</span> Settings saved successfully
        </div>
      )}

      {/* ── Recognition ── */}
      <Section
        title="Face Recognition"
        desc="Configure the face recognition engine behaviour"
      >
        <SettingRow
          label="Logout delay"
          desc="Seconds before auto-logout when face disappears from frame"
        >
          <div style={s.numberWrap}>
            <input
              className="input"
              style={{ width: "80px", textAlign: "center", fontFamily: "var(--font-mono)" }}
              type="number"
              min={1} max={60}
              value={settings.logoutDelay}
              onChange={(e) => update("logoutDelay", Number(e.target.value))}
            />
            <span style={s.unit}>seconds</span>
          </div>
        </SettingRow>

        <SettingRow
          label="Recognition tolerance"
          desc="Lower = stricter matching. Default 0.6 works for most cases"
        >
          <div style={s.sliderWrap}>
            <input
              type="range"
              min={0.3} max={0.9} step={0.05}
              value={settings.tolerance}
              onChange={(e) => update("tolerance", Number(e.target.value))}
              style={s.slider}
            />
            <span style={s.sliderVal}>{settings.tolerance.toFixed(2)}</span>
          </div>
        </SettingRow>

        <SettingRow
          label="Log unknown faces"
          desc="Record detection attempts for faces that don't match any employee"
        >
          <Toggle checked={settings.logUnknown} onChange={(v) => update("logUnknown", v)} />
        </SettingRow>
      </Section>

      {/* ── Dashboard ── */}
      <Section
        title="Dashboard"
        desc="Control how the dashboard displays and updates"
      >
        <SettingRow
          label="Auto-refresh"
          desc="Automatically poll attendance data at a set interval"
        >
          <Toggle checked={settings.autoRefresh} onChange={(v) => update("autoRefresh", v)} />
        </SettingRow>

        <SettingRow
          label="Refresh interval"
          desc="How often to poll for new attendance data (seconds)"
        >
          <div style={s.numberWrap}>
            <input
              className="input"
              style={{ width: "80px", textAlign: "center", fontFamily: "var(--font-mono)", opacity: settings.autoRefresh ? 1 : 0.4 }}
              type="number"
              min={1} max={60}
              value={settings.refreshInterval}
              onChange={(e) => update("refreshInterval", Number(e.target.value))}
              disabled={!settings.autoRefresh}
            />
            <span style={s.unit}>seconds</span>
          </div>
        </SettingRow>
      </Section>

      {/* ── Connection ── */}
      <Section
        title="Backend Connection"
        desc="URL of the Flask backend server"
      >
        <SettingRow
          label="Backend API URL"
          desc="Change if running the backend on a different host or port"
        >
          <div style={s.urlWrap}>
            <input
              className="input"
              style={{ minWidth: "280px", fontFamily: "var(--font-mono)", fontSize: "13px" }}
              type="text"
              value={settings.backendUrl}
              onChange={(e) => update("backendUrl", e.target.value)}
              placeholder="http://127.0.0.1:5000"
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => window.open(settings.backendUrl + "/")}
            >
              Test
            </button>
          </div>
        </SettingRow>
      </Section>

      <Section
        title="Camera Source Manager"
        desc="Configure USB/RTSP/HTTP sources now so future CCTV integrations are one-click."
      >
        <div style={{ padding: "16px 22px", display: "grid", gap: 10 }}>
          <div style={s.grid2}>
            <input className="input" placeholder="Source name (e.g. Gate CCTV)" value={cameraForm.name} onChange={(e) => updateCameraForm("name", e.target.value)} />
            <select className="input" value={cameraForm.source_type} onChange={(e) => updateCameraForm("source_type", e.target.value)}>
              <option value="usb">USB</option>
              <option value="rtsp">RTSP</option>
              <option value="http">HTTP</option>
            </select>
          </div>
          <input className="input" placeholder="Source value (USB index like 0, or rtsp/http url)" value={cameraForm.source_value} onChange={(e) => updateCameraForm("source_value", e.target.value)} />
          <div style={s.grid2}>
            <input className="input" placeholder="Username (optional)" value={cameraForm.username} onChange={(e) => updateCameraForm("username", e.target.value)} />
            <input className="input" placeholder="Password ref (optional)" value={cameraForm.password_ref} onChange={(e) => updateCameraForm("password_ref", e.target.value)} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={cameraForm.is_enabled} onChange={(e) => updateCameraForm("is_enabled", e.target.checked)} />
            Enabled
          </label>
          <div style={s.urlWrap}>
            <button className="btn btn-primary btn-sm" onClick={handleCameraSave}>{editingId ? "Update Source" : "Add Source"}</button>
            <button className="btn btn-secondary btn-sm" onClick={handleCameraTest}>Test Connection</button>
            {editingId ? <button className="btn btn-secondary btn-sm" onClick={resetCameraForm}>Cancel Edit</button> : null}
          </div>
          {cameraError ? <p style={{ color: "var(--danger)", margin: 0 }}>{cameraError}</p> : null}
          {cameraMessage ? <p style={{ color: "var(--accent)", margin: 0 }}>{cameraMessage}</p> : null}
        </div>

        <div style={{ padding: "0 22px 16px" }}>
          {cameraLoading ? (
            <p style={{ margin: 0, color: "var(--text-muted)" }}>Loading sources...</p>
          ) : safeCameraSources.length === 0 ? (
            <p style={{ margin: 0, color: "var(--text-muted)" }}>No camera sources configured yet.</p>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Type</th>
                  <th style={s.th}>Value</th>
                  <th style={s.th}>Secret Ref</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeCameraSources.map((row) => (
                  <tr key={row.id}>
                    <td style={s.td}>{row.name}</td>
                    <td style={s.td}>{String(row.source_type || "").toUpperCase()}</td>
                    <td style={s.td}>{row.source_value}</td>
                    <td style={s.td}>{row.password_ref ? "********" : "-"}</td>
                    <td style={s.td}>{row.is_active ? "Active" : row.is_enabled ? "Ready" : "Disabled"}</td>
                    <td style={s.td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleCameraEdit(row)}>Edit</button>
                        {!row.is_active ? <button className="btn btn-primary btn-sm" onClick={() => handleCameraActivate(row.id)}>Activate</button> : null}
                        {!row.is_active ? <button className="btn btn-danger btn-sm" onClick={() => handleCameraDelete(row)}>Delete</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Section>

      <Section
        title="Recent Camera Health"
        desc="Latest camera availability and reconnect logs"
      >
        <div style={{ padding: "0 22px 16px" }}>
          {safeHealthLogs.length === 0 ? (
            <p style={{ margin: "12px 0", color: "var(--text-muted)" }}>No health logs yet.</p>
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
                {safeHealthLogs.map((row) => (
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
      </Section>

      {/* ── Appearance ── */}
      <Section
        title="Appearance"
        desc="Interface preferences"
      >
        <SettingRow
          label="Dark mode"
          desc="Use dark theme across the application"
        >
          <Toggle checked={settings.darkMode} onChange={(v) => update("darkMode", v)} />
        </SettingRow>

        <SettingRow
          label="Desktop notifications"
          desc="Show browser notifications when attendance is marked"
        >
          <Toggle checked={settings.notifications} onChange={(v) => update("notifications", v)} />
        </SettingRow>
      </Section>

      {/* ── Danger zone ── */}
      <div style={s.dangerZone}>
        <div style={s.dangerHead}>
          <p style={s.dangerTitle}>Danger Zone</p>
          <p style={s.dangerDesc}>These actions are irreversible. Proceed with caution.</p>
        </div>
        {(dangerMessage || dangerError) && (
          <div style={{ padding: "12px 22px 0" }}>
            {dangerMessage ? <p style={s.dangerSuccess}>{dangerMessage}</p> : null}
            {dangerError ? <p style={s.dangerError}>{dangerError}</p> : null}
          </div>
        )}
        <div style={s.dangerActions}>
          <div style={s.dangerItem}>
            <div>
              <p style={s.dangerItemTitle}>Clear all encodings</p>
              <p style={s.dangerItemDesc}>Deletes all saved face encodings. Employees must be re-registered.</p>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleClearEncodings}
              disabled={dangerLoading === "encodings"}
            >
              {dangerLoading === "encodings" ? "Clearing..." : "Clear Encodings"}
            </button>
          </div>
          <div style={s.dangerItem}>
            <div>
              <p style={s.dangerItemTitle}>Reset attendance records</p>
              <p style={s.dangerItemDesc}>Permanently deletes all attendance history from the database.</p>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleResetAttendance}
              disabled={dangerLoading === "attendance"}
            >
              {dangerLoading === "attendance" ? "Resetting..." : "Reset Records"}
            </button>
          </div>
        </div>
      </div>

    </PageWrapper>
  );
};

export default Settings;

const s = {
  savedBanner: { display:"flex", alignItems:"center", gap:"8px", padding:"11px 16px", background:"var(--accent-dim)", border:"1px solid var(--accent-border)", borderRadius:"var(--r-md)", color:"var(--accent)", fontSize:"13.5px", fontWeight:"500" },

  /* Section */
  section:     { background:"var(--surface-1)", border:"1px solid var(--border)", borderRadius:"var(--r-lg)", overflow:"hidden" },
  sectionHead: { padding:"18px 22px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)" },
  sectionTitle:{ fontFamily:"var(--font-display)", fontWeight:"700", fontSize:"14px", color:"var(--text-primary)" },
  sectionDesc: { fontSize:"12.5px", color:"var(--text-muted)", marginTop:"3px" },
  sectionBody: { display:"flex", flexDirection:"column" },

  /* Setting row */
  settingRow:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", borderBottom:"1px solid var(--border)", gap:"24px", flexWrap:"wrap" },
  settingInfo:   { flex:1, minWidth:"200px" },
  settingLabel:  { fontSize:"14px", fontWeight:"500", color:"var(--text-primary)", marginBottom:"3px" },
  settingDesc:   { fontSize:"12px", color:"var(--text-muted)", lineHeight:1.5 },
  settingControl:{ flexShrink:0 },

  /* Toggle */
  toggle:      { width:"38px", height:"22px", borderRadius:"var(--r-pill)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", padding:0, display:"flex", alignItems:"center" },
  toggleThumb: { position:"absolute", width:"16px", height:"16px", borderRadius:"50%", background:"#fff", transition:"transform 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" },

  /* Number input */
  numberWrap: { display:"flex", alignItems:"center", gap:"8px" },
  unit:       { fontFamily:"var(--font-mono)", fontSize:"12px", color:"var(--text-muted)" },

  /* Slider */
  sliderWrap: { display:"flex", alignItems:"center", gap:"10px" },
  slider:     { accentColor:"var(--accent)", width:"140px", cursor:"pointer" },
  sliderVal:  { fontFamily:"var(--font-mono)", fontSize:"13px", color:"var(--accent)", minWidth:"36px" },

  /* URL row */
  urlWrap: { display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 },
  table: { width: "100%", borderCollapse: "collapse", border: "1px solid var(--border)" },
  th: { textAlign: "left", fontSize: 12, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", padding: "8px 10px" },
  td: { fontSize: 13, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", padding: "8px 10px" },

  /* Danger zone */
  dangerZone:      { background:"var(--surface-1)", border:"1px solid var(--danger-border)", borderRadius:"var(--r-lg)", overflow:"hidden" },
  dangerHead:      { padding:"16px 22px", borderBottom:"1px solid var(--danger-border)", background:"var(--danger-dim)" },
  dangerTitle:     { fontFamily:"var(--font-display)", fontWeight:"700", fontSize:"14px", color:"var(--danger)" },
  dangerDesc:      { fontSize:"12px", color:"var(--danger)", opacity:0.75, marginTop:"3px" },
  dangerActions:   { display:"flex", flexDirection:"column" },
  dangerItem:      { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", borderBottom:"1px solid var(--border)", gap:"20px", flexWrap:"wrap" },
  dangerItemTitle: { fontSize:"14px", fontWeight:"500", color:"var(--text-primary)", marginBottom:"3px" },
  dangerItemDesc:  { fontSize:"12px", color:"var(--text-muted)", lineHeight:1.5 },
  dangerSuccess:   { margin: "0 0 10px", color: "var(--accent)", fontSize: "13px" },
  dangerError:     { margin: "0 0 10px", color: "var(--danger)", fontSize: "13px" },
};
