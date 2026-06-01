import React from "react";

const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconBadge = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconIdCard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2"/>
    <line x1="7" y1="8" x2="17" y2="8"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
    <line x1="7" y1="16" x2="12" y2="16"/>
  </svg>
);

const Dashboard = ({ employee }) => {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const displayName = employee?.fullName || employee?.employeeCode || "Employee";

  const kpis = [
    {
      label: "Employee Code",
      value: employee?.employeeCode || "—",
      icon: <IconBadge />,
      color: "rgba(0,212,168,0.12)",
      iconColor: "#00d4a8",
    },
    {
      label: "User ID",
      value: employee?.id || "—",
      icon: <IconIdCard />,
      color: "rgba(244,114,182,0.12)",
      iconColor: "#f472b6",
    },
    {
      label: "Role",
      value: employee?.role || "—",
      icon: <IconShield />,
      color: "rgba(96,165,250,0.12)",
      iconColor: "#60a5fa",
    },
    {
      label: "Department",
      value: employee?.department || "—",
      icon: <IconCalendar />,
      color: "rgba(251,191,36,0.12)",
      iconColor: "#fbbf24",
    },
    {
      label: "Designation",
      value: employee?.designation || "—",
      icon: <IconClock />,
      color: "rgba(52,211,153,0.12)",
      iconColor: "#34d399",
    },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h3>{greeting()}, {displayName} 👋</h3>
          <p>Here's a quick overview of your account. Use the sidebar to navigate.</p>
        </div>
        {employee?.employeeCode && (
          <span className="welcome-code">{employee.employeeCode}</span>
        )}
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi-card" key={k.label}>
            <div
              className="kpi-icon"
              style={{ background: k.color, color: k.iconColor }}
            >
              {k.icon}
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p className="section-label" style={{ marginBottom: 10 }}>Account Snapshot</p>
        <div className="profile-grid">
          <div className="profile-field">
            <div className="profile-field-label">User ID</div>
            <div className="profile-field-value">{employee?.id || "—"}</div>
          </div>
          <div className="profile-field">
            <div className="profile-field-label">Department</div>
            <div className="profile-field-value">{employee?.department || "—"}</div>
          </div>
          <div className="profile-field">
            <div className="profile-field-label">Designation</div>
            <div className="profile-field-value">{employee?.designation || "—"}</div>
          </div>
          <div className="profile-field">
            <div className="profile-field-label">Email</div>
            <div className="profile-field-value">{employee?.email || "—"}</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="card">
        <p className="section-label" style={{ marginBottom: 14 }}>Quick Navigation</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { href: "/attendance", label: "View Attendance" },
            { href: "/salary",     label: "My Salary" },
            { href: "/profile",    label: "Edit Profile" },
            { href: "/holidays",   label: "Holidays" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: "var(--r-sm)",
                background: "var(--bg-input)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "border-color 0.14s, color 0.14s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
