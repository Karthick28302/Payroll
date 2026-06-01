import React, { useEffect, useRef, useState } from "react";
import useAuth            from "../hooks/useAuth";
import useAttendance      from "../hooks/useAttendance";
import { formatDateTime } from "../utils/formatDate";
import { calcDuration, durationColor } from "../utils/calcDuration";
import { getCameraStatus, videoFeedUrl }   from "../services/cameraService";
import { exportUrl }      from "../services/attendanceService";
import PageWrapper        from "../components/layout/PageWrapper";
import "../styles/dashboard.css";

/* ── Stat card ── */
const StatCard = ({ label, value, color, icon, delay = 0 }) => (
  <div style={{ ...s.statCard, animationDelay: `${delay}ms` }}>
    <div style={{ ...s.statBar, background: color }} />
    <div style={s.statTop}>
      <span style={{ ...s.statIcon, background: `${color}18`, color }}>{icon}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
    <div style={{ ...s.statValue, color }}>{value ?? "—"}</div>
  </div>
);

/* ── Camera feed ── */
const CameraPanel = () => {
  const [status, setStatus] = useState("connecting");
  const [feedNonce, setFeedNonce] = useState(() => Date.now());
  const [statusMeta, setStatusMeta] = useState(null);
  const retryAttemptsRef = useRef(0);
  const retryTimerRef = useRef(null);

  const loadStatus = async () => {
    try {
      const info = await getCameraStatus();
      setStatusMeta(info || null);
    } catch {
      // status endpoint best effort
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => {
      clearInterval(interval);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const scheduleRetry = () => {
    retryAttemptsRef.current += 1;
    const delay = Math.min(1000 * (2 ** (retryAttemptsRef.current - 1)), 8000);
    setStatus("reconnecting");
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }
    retryTimerRef.current = setTimeout(() => {
      setFeedNonce(Date.now());
      setStatus("connecting");
    }, delay);
  };

  return (
    <div style={s.cameraWrap}>
      {/* Status pill */}
      <div style={s.statusPill}>
        <span style={{
          ...s.statusDot,
          background: status === "live" ? "var(--accent)"
                    : status === "error"? "var(--danger)"
                    : "var(--warning)",
          boxShadow: status === "live" ? "0 0 7px var(--accent)" : "none",
        }} />
        <span style={s.statusText}>
          {status === "live" ? "Connected"
            : status === "reconnecting" ? "Reconnecting..."
            : status === "error" ? "Disconnected"
            : "Connecting..."}
        </span>
        {status === "error" && (
          <button style={s.retryBtn}
              onClick={() => {
                retryAttemptsRef.current = 0;
                setStatus("connecting");
                setFeedNonce(Date.now());
              }}>
            Retry
          </button>
        )}
      </div>
      {statusMeta ? (
        <div style={s.sourcePill}>
          {(statusMeta.fallback_in_use ? "Fallback" : "Primary")} · {statusMeta.current_stream_source || statusMeta.active_source || "unknown"}
        </div>
      ) : null}

      {/* Placeholder */}
      {status !== "live" && status !== "error" && (
        <div style={s.cameraPlaceholder}>
          <div style={s.scanLine} />
          <div style={{ textAlign: "center", zIndex: 2 }}>
            <div style={s.cameraIcon}>◉</div>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "10px" }}>
              Initialising camera stream...
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>
              Make sure the backend is running on port 5000
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={s.cameraError}>
          <span style={{ fontSize: "32px", color: "var(--danger)" }}>⊗</span>
          <p style={{ color: "var(--danger)", marginTop: "12px", fontWeight: 600 }}>
            Camera stream unavailable
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
            Backend may not be running
          </p>
        </div>
      )}

      {/* Stream */}
      <img
        key={feedNonce}
        src={videoFeedUrl({
          view: "dashboard",
          fps: 20,
          quality: 75,
          scale: 0.75,
          process_every: 2,
          cache_bust: feedNonce,
        })}
        alt="Live feed"
        style={{
          ...s.cameraImg,
          display: "block",
          opacity: status === "live" ? 1 : 0.78,
        }}
        onLoad={()  => {
          retryAttemptsRef.current = 0;
          setStatus("live");
        }}
        onError={() => {
          if (retryAttemptsRef.current >= 4) {
            setStatus("error");
          } else {
            scheduleRetry();
          }
        }}
      />

      {/* Corner brackets */}
      {[
        { top: "10px",    left: "10px",  borderTop: "2px solid var(--accent)", borderLeft:  "2px solid var(--accent)" },
        { top: "10px",    right: "10px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" },
        { bottom: "10px", left: "10px",  borderBottom: "2px solid var(--accent)", borderLeft:  "2px solid var(--accent)" },
        { bottom: "10px", right: "10px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" },
      ].map((corner, i) => (
        <div key={i} style={{ position: "absolute", width: "14px", height: "14px", pointerEvents: "none", ...corner }} />
      ))}

      {/* Live pill at bottom */}
      {status === "live" && (
        <div style={s.livePill}>
          <span style={s.liveDot} />
          FACE RECOGNITION ACTIVE
        </div>
      )}
    </div>
  );
};

/* ── Main page ── */
const Dashboard = () => {
  useAuth();

  const attendanceState = useAttendance({ interval: 5000 }) || {};
  const {
    records = [],
    stats = { total_today: 0, currently_present: 0 },
    loading = false,
    error = null,
    refresh = () => {},
  } = attendanceState;

  const total   = new Set(records.map((r) => r.name)).size;
  const present = stats.currently_present ?? 0;
  const absent  = Math.max(0, total - present);
  const rate    = total > 0 ? `${Math.round((present / total) * 100)}%` : "—";

  return (
    <PageWrapper
      title="Dashboard"
      subtitle="Live attendance overview and face recognition monitoring"
      actions={
        <>
          <button className="btn btn-secondary btn-sm" onClick={refresh}>↻ Refresh</button>
          <button className="btn btn-primary  btn-sm" onClick={() => window.open(exportUrl())}>
            ↓ Export Excel
          </button>
        </>
      }
    >

      {/* ── Stat cards ── */}
      <div style={s.statsGrid} className="stagger animate-stagger">
        <StatCard label="Total Employees"   value={total}   color="var(--info)"    icon="◎" delay={0}   />
        <StatCard label="Currently Present" value={present} color="var(--accent)"  icon="◉" delay={60}  />
        <StatCard label="Absent Today"      value={absent}  color="var(--danger)"  icon="○" delay={120} />
        <StatCard label="Attendance Rate"   value={rate}    color="var(--warning)" icon="▲" delay={180} />
      </div>

      {/* ── Two-col grid ── */}
      <div style={s.twoCol} className="dashboard-grid">

        {/* Camera */}
        <div style={s.card} className="hover-lift">
          <div style={s.cardHead}>
            <span style={s.cardHeadTitle}>Live Camera Feed</span>
            <span style={s.cardHeadBadge}>Port 5000</span>
          </div>
          <CameraPanel />
        </div>

        {/* Recent activity */}
        <div style={s.card} className="hover-lift">
          <div style={s.cardHead}>
            <span style={s.cardHeadTitle}>Recent Activity</span>
            <span style={s.cardHeadMeta}>Last 6 entries</span>
          </div>
          <div style={s.activityList} className="animate-stagger">
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center" }}>
                <div style={s.spinner} />
              </div>
            ) : records.slice(0, 6).length > 0 ? (
              records.slice(0, 6).map((r, i) => (
                <div key={i} style={s.activityItem}>
                  <div style={s.activityAvatar}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={s.activityMeta}>
                    <span style={s.activityName}>{r.name}</span>
                    <span style={s.activityTime}>
                      {r.logout_time ? "Left" : "Arrived"} ·{" "}
                      {new Date(r.login_time).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit", hour12: true,
                      })}
                    </span>
                  </div>
                  <span style={{
                    ...s.badge,
                    background: r.logout_time ? "var(--danger-dim)" : "var(--accent-dim)",
                    color:      r.logout_time ? "var(--danger)"     : "var(--accent)",
                    border:     `1px solid ${r.logout_time ? "var(--danger-border)" : "var(--accent-border)"}`,
                  }}>
                    <span style={{ fontSize: "7px" }}>●</span>
                    {r.logout_time ? "Offline" : "Present"}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                No activity today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Attendance table ── */}
      <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
        <div style={{ ...s.cardHead, padding: "16px 20px" }}>
          <span style={s.cardHeadTitle}>Today's Attendance</span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-secondary btn-sm" onClick={refresh}>↻</button>
            <button className="btn btn-primary btn-sm" onClick={() => window.open(exportUrl())}>
              ↓ Excel
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px 20px" }}>
            <div style={s.errorBox}><span>⚠</span> {error}</div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
            <div style={s.spinner} />
          </div>
        ) : records.length > 0 ? (
          <table style={s.table} className="animate-stagger">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#", "Employee", "Login Time", "Logout Time", "Duration", "Status"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={i} style={s.tr}>
                  <td style={{ ...s.td, ...s.tdMono, color: "var(--text-muted)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, color: "var(--text-primary)", textTransform: "capitalize" }}>
                    {r.name}
                  </td>
                  <td style={{ ...s.td, ...s.tdMono }}>{formatDateTime(r.login_time)}</td>
                  <td style={{ ...s.td, ...s.tdMono }}>{formatDateTime(r.logout_time)}</td>
                  <td style={{ ...s.td, ...s.tdMono, color: durationColor(r.login_time, r.logout_time), fontWeight: 500 }}>
                    {r.duration || calcDuration(r.login_time, r.logout_time)}
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: r.logout_time ? "var(--danger-dim)" : "var(--accent-dim)",
                      color:      r.logout_time ? "var(--danger)"     : "var(--accent)",
                      border:     `1px solid ${r.logout_time ? "var(--danger-border)" : "var(--accent-border)"}`,
                    }}>
                      <span style={{ fontSize: "7px" }}>●</span>
                      {r.logout_time ? "Offline" : "Present"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "50px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            No attendance records yet today.
          </div>
        )}
      </div>

    </PageWrapper>
  );
};

export default Dashboard;

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const s = {

  statsGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
    gap:                 "16px",
  },

  statCard: {
    background:    "var(--surface-1)",
    border:        "1px solid var(--border)",
    borderRadius:  "var(--r-lg)",
    padding:       "20px 22px",
    position:      "relative",
    overflow:      "hidden",
    opacity:       0,
    animation:     "fadeUp 0.4s ease forwards",
    transition:    "border-color 0.2s, box-shadow 0.2s",
  },
  statBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: "2px",
  },
  statTop: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    marginBottom: "14px",
  },
  statIcon: {
    width:          "34px",
    height:         "34px",
    borderRadius:   "var(--r-sm)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontSize:       "15px",
    flexShrink:     0,
  },
  statLabel: {
    fontFamily:    "var(--font-display)",
    fontSize:      "11px",
    fontWeight:    "600",
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color:         "var(--text-muted)",
    lineHeight:    1.3,
  },
  statValue: {
    fontFamily: "var(--font-display)",
    fontSize:   "38px",
    fontWeight: "800",
    lineHeight: 1,
  },

  /* Two column grid */
  twoCol: {
    display:             "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap:                 "20px",
  },

  /* Card */
  card: {
    background:   "var(--surface-1)",
    border:       "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    overflow:     "hidden",
  },
  cardHead: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    padding:        "14px 18px",
    borderBottom:   "1px solid var(--border)",
  },
  cardHeadTitle: {
    fontFamily: "var(--font-display)",
    fontWeight: "700",
    fontSize:   "14px",
    color:      "var(--text-primary)",
  },
  cardHeadBadge: {
    fontFamily:   "var(--font-mono)",
    fontSize:     "11px",
    padding:      "3px 10px",
    background:   "var(--accent-dim)",
    color:        "var(--accent)",
    border:       "1px solid var(--accent-border)",
    borderRadius: "var(--r-pill)",
  },
  cardHeadMeta: {
    fontSize:   "12px",
    color:      "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },

  /* Camera */
  cameraWrap: {
    position:       "relative",
    background:     "#020810",
    minHeight:      "320px",
    overflow:       "hidden",
  },
  statusPill: {
    position:       "absolute",
    top:            "12px",
    left:           "50%",
    transform:      "translateX(-50%)",
    display:        "flex",
    alignItems:     "center",
    gap:            "7px",
    background:     "rgba(0,0,0,0.72)",
    backdropFilter: "blur(10px)",
    padding:        "5px 14px",
    borderRadius:   "var(--r-pill)",
    border:         "1px solid var(--border)",
    zIndex:         10,
    whiteSpace:     "nowrap",
  },
  statusDot: {
    width:        "7px",
    height:       "7px",
    borderRadius: "50%",
    flexShrink:   0,
  },
  statusText: {
    fontFamily: "var(--font-mono)",
    fontSize:   "11px",
    color:      "var(--text-secondary)",
  },
  sourcePill: {
    position:       "absolute",
    top:            "44px",
    left:           "50%",
    transform:      "translateX(-50%)",
    fontFamily:     "var(--font-mono)",
    fontSize:       "10px",
    color:          "var(--text-muted)",
    background:     "rgba(0,0,0,0.58)",
    border:         "1px solid var(--border)",
    borderRadius:   "var(--r-pill)",
    padding:        "3px 10px",
    zIndex:         10,
    whiteSpace:     "nowrap",
  },
  sourceSwitch: {
    position:       "absolute",
    bottom:         "12px",
    right:          "12px",
    display:        "flex",
    gap:            "8px",
    zIndex:         6,
    flexWrap:       "wrap",
    justifyContent: "flex-end",
  },
  retryBtn: {
    background:   "var(--danger-dim)",
    color:        "var(--danger)",
    border:       "none",
    padding:      "2px 8px",
    borderRadius: "4px",
    fontSize:     "11px",
    cursor:       "pointer",
    fontFamily:   "var(--font-body)",
  },
  cameraPlaceholder: {
    position:       "absolute",
    inset:          0,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    overflow:       "hidden",
    pointerEvents:  "none",
    zIndex:         2,
  },
  scanLine: {
    position:   "absolute",
    left:       0,
    width:      "100%",
    height:     "2px",
    background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
    opacity:    0.3,
    animation:  "scan-line 3s linear infinite",
    zIndex:     1,
  },
  cameraIcon: {
    fontSize:    "40px",
    color:       "rgba(0,212,168,0.25)",
    marginBottom:"8px",
    animation:   "glow-pulse 2.5s ease infinite",
  },
  cameraError: {
    textAlign:      "center",
    padding:        "48px 24px",
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
  },
  cameraImg: {
    width:      "100%",
    minHeight:  "320px",
    objectFit:  "cover",
    display:    "block",
    imageRendering: "auto",
  },
  livePill: {
    position:       "absolute",
    bottom:         "12px",
    left:           "50%",
    transform:      "translateX(-50%)",
    display:        "flex",
    alignItems:     "center",
    gap:            "7px",
    background:     "rgba(0,0,0,0.75)",
    backdropFilter: "blur(10px)",
    padding:        "5px 14px",
    borderRadius:   "var(--r-pill)",
    border:         "1px solid var(--border)",
    fontFamily:     "var(--font-mono)",
    fontSize:       "10px",
    color:          "var(--text-secondary)",
    whiteSpace:     "nowrap",
    zIndex:         5,
  },
  liveDot: {
    width:        "6px",
    height:       "6px",
    borderRadius: "50%",
    background:   "var(--danger)",
    boxShadow:    "0 0 6px var(--danger)",
    display:      "inline-block",
    animation:    "pulse-dot 1.2s ease infinite",
    flexShrink:   0,
  },

  /* Activity list */
  activityList: {
    display:       "flex",
    flexDirection: "column",
    minHeight:     "320px",
  },
  activityItem: {
    display:    "flex",
    alignItems: "center",
    gap:        "12px",
    padding:    "10px 18px",
    transition: "background 0.12s",
    borderBottom: "1px solid var(--border)",
    cursor:     "default",
  },
  activityAvatar: {
    width:          "34px",
    height:         "34px",
    borderRadius:   "8px",
    background:     "var(--accent-dim)",
    border:         "1px solid var(--accent-border)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    color:          "var(--accent)",
    fontFamily:     "var(--font-display)",
    fontWeight:     "700",
    fontSize:       "13px",
    flexShrink:     0,
  },
  activityMeta: {
    flex:          1,
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
    overflow:      "hidden",
  },
  activityName: {
    fontSize:     "13px",
    fontWeight:   "600",
    color:        "var(--text-primary)",
    textTransform:"capitalize",
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textOverflow: "ellipsis",
  },
  activityTime: {
    fontFamily: "var(--font-mono)",
    fontSize:   "11px",
    color:      "var(--text-muted)",
  },

  /* Badge */
  badge: {
    display:      "inline-flex",
    alignItems:   "center",
    gap:          "5px",
    padding:      "3px 9px",
    borderRadius: "var(--r-pill)",
    fontSize:     "11.5px",
    fontWeight:   "500",
    whiteSpace:   "nowrap",
    flexShrink:   0,
  },

  /* Table */
  table: {
    width:          "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding:       "10px 16px",
    textAlign:     "left",
    fontFamily:    "var(--font-display)",
    fontSize:      "11px",
    fontWeight:    "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color:         "var(--text-muted)",
    whiteSpace:    "nowrap",
  },
  tr: {
    borderBottom: "1px solid var(--border)",
    transition:   "background 0.12s",
  },
  td: {
    padding:   "13px 16px",
    fontSize:  "13.5px",
    color:     "var(--text-secondary)",
    verticalAlign: "middle",
  },
  tdMono: {
    fontFamily: "var(--font-mono)",
    fontSize:   "12.5px",
  },

  /* Error box */
  errorBox: {
    display:      "flex",
    alignItems:   "center",
    gap:          "8px",
    padding:      "10px 14px",
    background:   "var(--danger-dim)",
    border:       "1px solid var(--danger-border)",
    borderRadius: "var(--r-md)",
    color:        "var(--danger)",
    fontSize:     "13px",
    fontWeight:   "500",
  },

  /* Spinner */
  spinner: {
    width:        "24px",
    height:       "24px",
    border:       "2px solid var(--border)",
    borderTop:    "2px solid var(--accent)",
    borderRadius: "50%",
    animation:    "spin 0.65s linear infinite",
  },
};

/* ── Hover effects (injected once) ── */
if (typeof document !== "undefined" && !document.getElementById("dashboard-hover-style")) {
  const el = document.createElement("style");
  el.id = "dashboard-hover-style";
  el.textContent = `
    [data-activity]:hover { background: var(--surface-hover) !important; }
    [data-tr]:hover       { background: var(--surface-hover) !important; }
  `;
  document.head.appendChild(el);
}
