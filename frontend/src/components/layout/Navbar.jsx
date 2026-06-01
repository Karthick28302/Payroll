import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_META = {
  "/dashboard":  { label: "Dashboard",    icon: "▦" },
  "/monitor":    { label: "Live Monitor", icon: "◉" },
  "/attendance": { label: "Attendance",   icon: "☰" },
  "/employees":  { label: "Employees",    icon: "◎" },
  "/register":   { label: "Register",     icon: "⊕" },
  "/reports":    { label: "Reports",      icon: "⊟" },
  "/settings":   { label: "Settings",     icon: "⚙" },
};

const Navbar = () => {
  const { pathname } = useLocation();
  const meta         = ROUTE_META[pathname] || { label: "Page", icon: "▦" };
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <header style={s.navbar} className="admin-navbar">

      {/* ── Left: breadcrumb ── */}
      <div style={s.breadcrumb} className="admin-navbar__breadcrumb">
        <span style={s.breadcrumbRoot}>SmartAttend</span>
        <span style={s.breadcrumbSep}>/</span>
        <span style={s.breadcrumbIcon}>{meta.icon}</span>
        <span style={s.breadcrumbCurrent}>{meta.label}</span>
      </div>

      {/* ── Right: clock + status ── */}
      <div style={s.rightGroup} className="admin-navbar__right">
        {/* Live indicator */}
        <div style={s.liveBadge} className="admin-navbar__live">
          <span style={s.liveDot} />
          <span style={s.liveText}>System Online</span>
        </div>

        {/* Clock */}
        <div style={s.clock} className="admin-navbar__clock">
          <span style={s.clockTime}>{timeStr}</span>
          <span style={s.clockDate}>{dateStr}</span>
        </div>

        {/* Admin avatar */}
        <div style={s.avatar} title="Administrator">A</div>
      </div>

    </header>
  );
};

export default Navbar;

const s = {
  navbar: {
    height:        "var(--topbar-h, 60px)",
    background:    "var(--surface-1)",
    borderBottom:  "1px solid var(--border)",
    display:       "flex",
    alignItems:    "center",
    justifyContent:"space-between",
    padding:       "0 28px",
    position:      "sticky",
    top:           0,
    zIndex:        "var(--z-topbar, 90)",
    backdropFilter:"blur(12px)",
  },

  /* Breadcrumb */
  breadcrumb: {
    display:    "flex",
    alignItems: "center",
    gap:        "7px",
  },
  breadcrumbRoot: {
    fontFamily: "var(--font-display)",
    fontSize:   "13px",
    fontWeight: "600",
    color:      "var(--text-muted)",
  },
  breadcrumbSep: {
    color:    "var(--text-muted)",
    fontSize: "13px",
  },
  breadcrumbIcon: {
    fontSize: "13px",
    color:    "var(--accent)",
  },
  breadcrumbCurrent: {
    fontFamily: "var(--font-display)",
    fontSize:   "13px",
    fontWeight: "700",
    color:      "var(--text-primary)",
  },

  /* Right group */
  rightGroup: {
    display:    "flex",
    alignItems: "center",
    gap:        "14px",
  },

  /* Live badge */
  liveBadge: {
    display:      "flex",
    alignItems:   "center",
    gap:          "6px",
    padding:      "5px 12px",
    background:   "var(--accent-dim)",
    border:       "1px solid var(--accent-border)",
    borderRadius: "var(--r-pill)",
  },
  liveDot: {
    width:        "6px",
    height:       "6px",
    borderRadius: "50%",
    background:   "var(--accent)",
    boxShadow:    "0 0 6px var(--accent)",
    display:      "inline-block",
    animation:    "pulse-dot 2s ease infinite",
    flexShrink:   0,
  },
  liveText: {
    fontFamily: "var(--font-mono)",
    fontSize:   "10.5px",
    color:      "var(--accent)",
  },

  /* Clock */
  clock: {
    display:       "flex",
    flexDirection: "column",
    alignItems:    "flex-end",
    gap:           "1px",
  },
  clockTime: {
    fontFamily: "var(--font-mono)",
    fontSize:   "13px",
    fontWeight: "500",
    color:      "var(--text-primary)",
  },
  clockDate: {
    fontFamily: "var(--font-mono)",
    fontSize:   "10px",
    color:      "var(--text-muted)",
  },

  /* Avatar */
  avatar: {
    width:          "34px",
    height:         "34px",
    borderRadius:   "9px",
    background:     "linear-gradient(135deg, var(--accent), var(--info))",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "var(--font-display)",
    fontWeight:     "800",
    fontSize:       "13px",
    color:          "#050D1C",
    cursor:         "pointer",
    flexShrink:     0,
  },
};
