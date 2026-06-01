import React, { useEffect, useState } from "react";
import Loader from "../components/common/Loader";
import { getMyAttendance } from "../services/employeeService";
import { formatDate } from "../utils/dateFormat";

const MONTHS = [
  { value: "1",  label: "January" },  { value: "2",  label: "February" },
  { value: "3",  label: "March" },    { value: "4",  label: "April" },
  { value: "5",  label: "May" },      { value: "6",  label: "June" },
  { value: "7",  label: "July" },     { value: "8",  label: "August" },
  { value: "9",  label: "September" },{ value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const statusClass = (status) => {
  const v = (status || "").toLowerCase();
  if (v === "present") return "pill pill-present";
  if (v === "absent")  return "pill pill-absent";
  return "pill pill-default";
};

const fmtTime = (val) =>
  val ? new Date(val).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

const MyAttendance = () => {
  const now = new Date();
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [month, setMonth]   = useState(String(now.getMonth() + 1));
  const [year, setYear]     = useState(String(now.getFullYear()));

  const yearOptions = Array.from({ length: 6 }, (_, i) =>
    String(now.getFullYear() - i)
  );

  const fetchData = async (m, y) => {
    try {
      setLoading(true); setError("");
      const res = await getMyAttendance({ month: m, year: y });
      setRows(res);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(month, year); }, []); // eslint-disable-line

  const handleApply = () => fetchData(month, year);

  const handleReset = () => {
    const m = String(now.getMonth() + 1);
    const y = String(now.getFullYear());
    setMonth(m); setYear(y);
    fetchData(m, y);
  };

  const safeRows = Array.isArray(rows) ? rows : [];

  /* summary counts */
  const present = safeRows.filter((r) => (r.status || "").toLowerCase() === "present").length;
  const absent  = safeRows.filter((r) => (r.status || "").toLowerCase() === "absent").length;

  return (
    <div>
      <div className="page-header">
        <h2>My Attendance</h2>
        <p>Track your daily login, logout, and working hours</p>
      </div>

      {/* Summary pills */}
      {!loading && safeRows.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div className="card" style={{ padding: "10px 18px", display: "flex", gap: 8, alignItems: "center" }}>
            <span className="pill pill-present">{present} Present</span>
            <span className="pill pill-absent">{absent} Absent</span>
            <span className="pill pill-default">{safeRows.length} Total</span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        <span className="filter-label">
          <IconFilter /> Filter
        </span>

        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 8, margin: 0 }}>
          <label className="form-label" htmlFor="att-month" style={{ margin: 0, whiteSpace: "nowrap" }}>Month</label>
          <select
            id="att-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ minWidth: 130 }}
          >
            {MONTHS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 8, margin: 0 }}>
          <label className="form-label" htmlFor="att-year" style={{ margin: 0 }}>Year</label>
          <select
            id="att-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button className="btn-primary" type="button" onClick={handleApply}>
          <IconFilter /> Apply
        </button>
        <button className="btn-ghost" type="button" onClick={handleReset}>
          <IconRefresh /> Reset
        </button>
      </div>

      {/* Table card */}
      <div className="card">
        {loading ? (
          <Loader message="Loading attendance…" />
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 0 }}>
            <IconAlert /> {error}
          </div>
        ) : safeRows.length === 0 ? (
          <div className="state-box">
            <p className="state-msg">No attendance records found for the selected period.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Login</th>
                  <th>Logout</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {safeRows.map((row, i) => (
                  <tr key={row.id ?? i}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {i + 1}
                    </td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {formatDate(row.work_date)}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      {fmtTime(row.login_time)}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      {fmtTime(row.logout_time)}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent)" }}>
                      {row.total_hours ?? "—"}
                    </td>
                    <td>
                      <span className={statusClass(row.status)}>
                        {row.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAttendance;
