import React, { useEffect, useState } from "react";
import Loader from "../components/common/Loader";
import { getMySalary } from "../services/employeeService";
import { formatDate } from "../utils/dateFormat";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const fmtMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtMonthYear = (month, year) => {
  const m = Number(month || 1) - 1;
  const y = Number(year || new Date().getFullYear());
  return new Date(y, m, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
};

const MySalary = () => {
  const now = new Date();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const yearOptions = Array.from({ length: 6 }, (_, i) => String(now.getFullYear() - i));

  const fetchData = async (m, y) => {
    try {
      setLoading(true);
      setError("");
      const res = await getMySalary({ month: m, year: y });
      setRows(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load salary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => fetchData(month, year);

  const handleReset = () => {
    const m = String(now.getMonth() + 1);
    const y = String(now.getFullYear());
    setMonth(m);
    setYear(y);
    fetchData(m, y);
  };

  const totalNet = rows.reduce((sum, row) => sum + Number(row.net_salary || 0), 0);
  const paidCount = rows.filter((row) => Boolean(row.paid_on)).length;
  const unpaidCount = rows.length - paidCount;

  return (
    <div>
      <div className="page-header">
        <h2>My Salary</h2>
        <p>Track your monthly salary breakdown and payment status</p>
      </div>

      {!loading && rows.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div className="card" style={{ padding: "10px 18px", display: "flex", gap: 8, alignItems: "center" }}>
            <span className="pill pill-present">{paidCount} Paid</span>
            <span className="pill pill-absent">{unpaidCount} Pending</span>
            <span className="pill pill-default">Rs {fmtMoney(totalNet)}</span>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <span className="filter-label">
          <IconFilter /> Filter
        </span>

        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 8, margin: 0 }}>
          <label className="form-label" htmlFor="sal-month" style={{ margin: 0, whiteSpace: "nowrap" }}>
            Month
          </label>
          <select
            id="sal-month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ minWidth: 130 }}
          >
            {MONTHS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 8, margin: 0 }}>
          <label className="form-label" htmlFor="sal-year" style={{ margin: 0 }}>
            Year
          </label>
          <select id="sal-year" value={year} onChange={(e) => setYear(e.target.value)}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
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

      <div className="card">
        {loading ? (
          <Loader message="Loading salary…" />
        ) : error ? (
          <div className="alert alert-error" style={{ margin: 0 }}>
            <IconAlert /> {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="state-box">
            <p className="state-msg">No salary records found for the selected period.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Month</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Paid On</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id ?? i}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {i + 1}
                    </td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {fmtMonthYear(row.month, row.year)}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>Rs {fmtMoney(row.basic_salary)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>Rs {fmtMoney(row.allowances)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>Rs {fmtMoney(row.deductions)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent)" }}>
                      Rs {fmtMoney(row.net_salary)}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
                      {row.paid_on ? formatDate(row.paid_on) : "—"}
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

export default MySalary;
