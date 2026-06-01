import React, { useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import useAttendance from "../hooks/useAttendance";
import { formatDateTime, todayISO } from "../utils/formatDate";
import { calcDuration } from "../utils/calcDuration";
import { exportUrl } from "../services/attendanceService";
import PageWrapper from "../components/layout/PageWrapper";

function AttendanceRecords() {
  useAuth();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState({ from: null, to: null });

  const attendanceState = useAttendance({
    from: applied.from,
    to: applied.to,
    interval: 0,
  }) || {};
  const {
    records = [],
    loading = false,
    error = null,
    refresh = () => {},
  } = attendanceState;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => (r.name || "").toLowerCase().includes(q));
  }, [records, search]);

  const totals = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => !r.logout_time).length;
    const offline = total - present;
    const employees = new Set(records.map((r) => r.name)).size;
    return { total, present, offline, employees };
  }, [records]);

  const handleApply = () => {
    setApplied({ from: fromDate || null, to: toDate || null });
    refresh();
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setSearch("");
    setApplied({ from: null, to: null });
  };

  const handleExport = () => {
    window.open(exportUrl({ from: fromDate || undefined, to: toDate || undefined }));
  };

  return (
    <PageWrapper
      title="Attendance Records"
      subtitle="Attendance history and filters"
      actions={
        <button className="btn btn-secondary btn-sm" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      }
    >
      <div style={s.statsGrid}>
        <StatCard label="Total Records" value={totals.total} />
        <StatCard label="Currently In" value={totals.present} />
        <StatCard label="Left Today" value={totals.offline} />
        <StatCard label="Employees" value={totals.employees} />
      </div>

      <div style={s.toolbar}>
        <input
          className="input"
          type="text"
          placeholder="Search by employee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.search}
        />

        <input className="input" type="date" value={fromDate} max={todayISO()} onChange={(e) => setFromDate(e.target.value)} />
        <input className="input" type="date" value={toDate} max={todayISO()} onChange={(e) => setToDate(e.target.value)} />

        <button className="btn btn-primary btn-sm" onClick={handleApply}>Apply</button>
        <button className="btn btn-secondary btn-sm" onClick={handleClear}>Clear</button>
        <button className="btn btn-secondary btn-sm" onClick={refresh} disabled={loading}>Refresh</button>
        <button className="btn btn-primary btn-sm" onClick={handleExport}>Export Excel</button>
      </div>

      <div style={s.card}>
        {error ? <div style={s.errorBox}>{error}</div> : null}

        {loading ? (
          <div style={s.empty}>Loading attendance records...</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>No attendance records found.</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Employee</th>
                  <th style={s.th}>Login Time</th>
                  <th style={s.th}>Logout Time</th>
                  <th style={s.th}>Duration</th>
                  <th style={s.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const status = r.logout_time ? "Offline" : "Present";
                  return (
                    <tr key={i} style={s.row}>
                      <td style={s.td}>{i + 1}</td>
                      <td style={{ ...s.td, textTransform: "capitalize", fontWeight: 600, color: "var(--text-primary)" }}>
                        {r.name || "-"}
                      </td>
                      <td style={{ ...s.td, ...s.mono }}>{formatDateTime(r.login_time)}</td>
                      <td style={{ ...s.td, ...s.mono }}>{formatDateTime(r.logout_time)}</td>
                      <td style={{ ...s.td, ...s.mono }}>{r.duration || calcDuration(r.login_time, r.logout_time)}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...(status === "Present" ? s.badgeSuccess : s.badgeDanger) }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={s.statCard}>
      <p style={s.statLabel}>{label}</p>
      <p style={s.statValue}>{value}</p>
    </div>
  );
}

export default AttendanceRecords;

const s = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  statCard: {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: "16px 18px",
  },
  statLabel: {
    margin: 0,
    color: "var(--text-muted)",
    fontFamily: "var(--font-display)",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    fontWeight: 600,
  },
  statValue: {
    margin: "8px 0 0",
    color: "var(--text-primary)",
    fontSize: "36px",
    fontWeight: 800,
    lineHeight: 1,
    fontFamily: "var(--font-display)",
  },
  toolbar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: "14px",
  },
  search: {
    minWidth: "260px",
  },
  card: {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    overflow: "hidden",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontFamily: "var(--font-display)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
  },
  row: {
    borderBottom: "1px solid var(--border)",
  },
  td: {
    padding: "12px 16px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
  },
  mono: {
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "var(--r-pill)",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 600,
  },
  badgeSuccess: {
    background: "var(--accent-dim)",
    color: "var(--accent)",
    border: "1px solid var(--accent-border)",
  },
  badgeDanger: {
    background: "var(--danger-dim)",
    color: "var(--danger)",
    border: "1px solid var(--danger-border)",
  },
  errorBox: {
    margin: "12px",
    padding: "10px 12px",
    borderRadius: "var(--r-md)",
    border: "1px solid var(--danger-border)",
    background: "var(--danger-dim)",
    color: "var(--danger)",
    fontSize: "13px",
  },
  empty: {
    padding: "20px",
    color: "var(--text-muted)",
    fontSize: "13px",
  },
};
