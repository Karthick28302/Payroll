import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAdminSession } from "../../utils/auth";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: "D", desc: "Overview & stats" },
  { to: "/monitor", label: "Live Monitor", icon: "L", desc: "Camera & recognition" },
  { to: "/attendance", label: "Attendance", icon: "A", desc: "Records & history" },
  { to: "/employees", label: "Employees", icon: "E", desc: "Registered users" },
  { to: "/register", label: "Register", icon: "R", desc: "Add new employee" },
  { to: "/cctv", label: "CCTV Setup", icon: "C", desc: "Sources & health" },
  { to: "/reports", label: "Reports", icon: "P", desc: "Export & analytics" },
];

const Sidebar = () => {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const [collapsed,  setCollapsed] = useState(false);

  const logout = () => {
    clearAdminSession();
    navigate("/login");
  };

  return (
    <aside style={{ ...s.sidebar, width: collapsed ? "68px" : "var(--sidebar-w, 244px)" }}>

      {/* ── Logo ── */}
      <div style={s.logoRow}>
        <div style={s.logoMark}>SA</div>
        {!collapsed && (
          <div style={s.logoText}>
            <span style={s.logoName}>SmartAttend</span>
            <span style={s.logoSub}>Admin Console</span>
          </div>
        )}
        <button
          style={{ ...s.collapseBtn, marginLeft: collapsed ? "auto" : undefined }}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={s.nav}>
        {!collapsed && <p style={s.navSection}>NAVIGATION</p>}

        {NAV_LINKS.map(({ to, label, icon, desc }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link key={to} to={to} style={{ textDecoration: "none" }} title={collapsed ? label : undefined}>
              <div style={{
                ...s.navItem,
                ...(active ? s.navActive : {}),
                justifyContent: collapsed ? "center" : "flex-start",
                padding:        collapsed ? "10px" : "9px 12px",
              }}>
                <span style={{ ...s.navIcon, color: active ? "var(--accent)" : "var(--text-muted)" }}>
                  {icon}
                </span>
                {!collapsed && (
                  <div style={s.navMeta}>
                    <span style={{ ...s.navLabel, color: active ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: active ? 600 : 400 }}>
                      {label}
                    </span>
                    <span style={s.navDesc}>{desc}</span>
                  </div>
                )}
                {!collapsed && active && <div style={s.activeDot} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={s.footer}>
        {!collapsed && (
          <div style={s.adminCard}>
            <div style={s.adminAvatar}>A</div>
            <div style={s.adminInfo}>
              <span style={s.adminName}>Administrator</span>
              <span style={s.adminRole}>Full Access</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          style={{ ...s.logoutBtn, width: collapsed ? "44px" : "100%", padding: collapsed ? "10px" : "9px 14px" }}
          title="Logout"
        >
          <span style={{ fontSize: "14px" }}>⏏</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;

/* ── Styles ── */
const s = {
  sidebar: {
    height:        "100vh",
    background:    "var(--surface-1)",
    borderRight:   "1px solid var(--border)",
    position:      "fixed",
    top:           0,
    left:          0,
    display:       "flex",
    flexDirection: "column",
    zIndex:        "var(--z-sidebar, 100)",
    overflowY:     "auto",
    overflowX:     "hidden",
    transition:    "width 0.2s ease",
  },

  /* Logo row */
  logoRow: {
    display:     "flex",
    alignItems:  "center",
    gap:         "10px",
    padding:     "20px 14px 18px",
    borderBottom:"1px solid var(--border)",
    minHeight:   "68px",
  },
  logoMark: {
    width:          "36px",
    height:         "36px",
    background:     "var(--accent)",
    borderRadius:   "9px",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "var(--font-display)",
    fontWeight:     "800",
    fontSize:       "13px",
    color:          "#050D1C",
    flexShrink:     0,
  },
  logoText: {
    display:       "flex",
    flexDirection: "column",
    flex:          1,
    overflow:      "hidden",
  },
  logoName: {
    fontFamily:  "var(--font-display)",
    fontWeight:  "700",
    fontSize:    "14px",
    color:       "var(--text-primary)",
    whiteSpace:  "nowrap",
  },
  logoSub: {
    fontSize:  "10.5px",
    color:     "var(--text-muted)",
    marginTop: "1px",
  },
  collapseBtn: {
    background:   "transparent",
    border:       "1px solid var(--border)",
    color:        "var(--text-muted)",
    borderRadius: "6px",
    width:        "24px",
    height:       "24px",
    fontSize:     "9px",
    display:      "flex",
    alignItems:   "center",
    justifyContent:"center",
    cursor:       "pointer",
    flexShrink:   0,
    transition:   "all 0.15s",
  },

  /* Nav */
  nav: {
    flex:          1,
    padding:       "14px 10px",
    display:       "flex",
    flexDirection: "column",
    gap:           "2px",
    overflowY:     "auto",
  },
  navSection: {
    fontFamily:    "var(--font-display)",
    fontSize:      "9.5px",
    fontWeight:    "600",
    letterSpacing: "0.1em",
    color:         "var(--text-muted)",
    padding:       "0 6px",
    marginBottom:  "6px",
  },
  navItem: {
    display:      "flex",
    alignItems:   "center",
    gap:          "9px",
    borderRadius: "var(--r-md)",
    cursor:       "pointer",
    transition:   "all 0.15s",
    position:     "relative",
    minHeight:    "40px",
  },
  navActive: {
    background:  "var(--accent-dim)",
    border:      "1px solid var(--accent-border)",
  },
  navIcon: {
    fontSize:   "15px",
    width:      "20px",
    textAlign:  "center",
    flexShrink: 0,
    lineHeight: 1,
  },
  navMeta: {
    display:       "flex",
    flexDirection: "column",
    flex:          1,
    overflow:      "hidden",
    gap:           "1px",
  },
  navLabel: {
    fontSize:   "13px",
    color:      "var(--text-secondary)",
    whiteSpace: "nowrap",
    overflow:   "hidden",
    textOverflow:"ellipsis",
  },
  navDesc: {
    fontSize:   "10.5px",
    color:      "var(--text-muted)",
    whiteSpace: "nowrap",
    overflow:   "hidden",
    textOverflow:"ellipsis",
  },
  activeDot: {
    width:        "6px",
    height:       "6px",
    borderRadius: "50%",
    background:   "var(--accent)",
    boxShadow:    "0 0 8px var(--accent)",
    flexShrink:   0,
  },

  /* Footer */
  footer: {
    padding:      "12px 10px",
    borderTop:    "1px solid var(--border)",
    display:      "flex",
    flexDirection:"column",
    gap:          "8px",
  },
  adminCard: {
    display:      "flex",
    alignItems:   "center",
    gap:          "9px",
    padding:      "10px",
    background:   "var(--surface-2)",
    borderRadius: "var(--r-md)",
    border:       "1px solid var(--border)",
  },
  adminAvatar: {
    width:          "30px",
    height:         "30px",
    borderRadius:   "7px",
    background:     "linear-gradient(135deg, var(--accent), var(--info))",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "var(--font-display)",
    fontWeight:     "700",
    fontSize:       "12px",
    color:          "#050D1C",
    flexShrink:     0,
  },
  adminInfo: {
    display:       "flex",
    flexDirection: "column",
    gap:           "1px",
    overflow:      "hidden",
  },
  adminName: {
    fontSize:   "12.5px",
    fontWeight: "600",
    color:      "var(--text-primary)",
    whiteSpace: "nowrap",
  },
  adminRole: {
    fontSize:  "10.5px",
    color:     "var(--accent)",
  },
  logoutBtn: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            "7px",
    background:     "var(--danger-dim)",
    color:          "var(--danger)",
    border:         "1px solid var(--danger-border)",
    borderRadius:   "var(--r-md)",
    cursor:         "pointer",
    fontFamily:     "var(--font-body)",
    fontSize:       "13px",
    fontWeight:     "500",
    transition:     "all 0.15s",
    whiteSpace:     "nowrap",
    overflow:       "hidden",
  },
};


