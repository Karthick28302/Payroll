import React, { useEffect, useState } from "react";
import Loader from "../components/common/Loader";
import { getMyHolidays } from "../services/employeeService";
import { formatDate } from "../utils/dateFormat";

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const typeClass = (type) => {
  const v = (type || "").toLowerCase();
  if (v === "national")  return "pill pill-present";
  if (v === "optional")  return "pill pill-optional";
  if (v === "regional")  return "pill pill-holiday";
  return "pill pill-default";
};

const Holidays = () => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyHolidays();
        setRows(Array.isArray(res) ? res : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load holidays.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const safeRows = Array.isArray(rows) ? rows : [];

  /* upcoming vs past split */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = safeRows.filter((r) => new Date(r.holiday_date) >= today);
  const past     = safeRows.filter((r) => new Date(r.holiday_date) < today);

  const renderTable = (data, dimmed = false) => (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Holiday</th>
            <th>Date</th>
            <th>Day</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const d = new Date(row.holiday_date);
            const dayName = d.toLocaleString("en-IN", { weekday: "long" });
            return (
              <tr key={row.id ?? i} style={dimmed ? { opacity: 0.5 } : {}}>
                <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{i + 1}</td>
                <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.holiday_name}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{formatDate(row.holiday_date)}</td>
                <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{dayName}</td>
                <td>
                  <span className={typeClass(row.holiday_type)}>
                    {row.holiday_type || "General"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Holidays</h2>
        <p>Official company holidays for the year</p>
      </div>

      {loading ? (
        <div className="card"><Loader message="Loading holidays…" /></div>
      ) : error ? (
        <div className="alert alert-error"><IconAlert /> {error}</div>
      ) : safeRows.length === 0 ? (
        <div className="card">
          <div className="state-box">
            <div style={{ color: "var(--text-muted)", marginBottom: 10 }}><IconSun /></div>
            <p className="state-msg">No holidays found.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
            <span className="pill pill-present">{upcoming.length} Upcoming</span>
            <span className="pill pill-default">{past.length} Past</span>
            <span className="pill pill-default">{safeRows.length} Total</span>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <p className="section-label" style={{ marginBottom: 10 }}>Upcoming</p>
              <div className="card" style={{ marginBottom: 16 }}>
                {renderTable(upcoming)}
              </div>
            </>
          )}

          {/* Past */}
          {past.length > 0 && (
            <>
              <p className="section-label" style={{ marginBottom: 10 }}>Past</p>
              <div className="card">
                {renderTable(past, true)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Holidays;
