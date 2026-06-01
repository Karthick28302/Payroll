import React, { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import PageWrapper from "../components/layout/PageWrapper";
import {
  getPayrollSummary,
  markPayrollPaid,
  markPayrollPending,
  payrollExportUrl,
} from "../services/payrollService";
import { exportUrl as attendanceExportUrl, getAttendanceAnalytics } from "../services/attendanceService";

const Reports = () => {
  useAuth();

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [employee, setEmployee] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");

  const params = useMemo(
    () => ({
      month,
      year,
      ...(employee.trim() ? { employee: employee.trim() } : {}),
    }),
    [month, year, employee]
  );

  const analyticsRange = useMemo(() => {
    const y = Number(year);
    const m = Number(month);
    const lastDay = new Date(y, m, 0).getDate();
    const format = (day) => `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return {
      from: format(1),
      to: format(lastDay),
      label: `${new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(y, m - 1, 1))} ${y}`,
    };
  }, [month, year]);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPayrollSummary(params);
      setRows(data?.rows || []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load payroll data.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const data = await getAttendanceAnalytics({
        from: analyticsRange.from,
        to: analyticsRange.to,
      });
      setAnalytics(data || null);
    } catch (err) {
      setAnalyticsError(err?.response?.data?.error || "Failed to load attendance analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsRange.from, analyticsRange.to]);

  useEffect(() => {
    fetchAnalytics();
    fetchPayroll();
  }, [fetchAnalytics, fetchPayroll]);

  const totals = rows.reduce(
    (acc, row) => {
      acc.gross += Number(row.gross_pay || 0);
      acc.net += Number(row.net_pay || 0);
      acc.deductions += Number(row.total_deductions || 0);
      return acc;
    },
    { gross: 0, net: 0, deductions: 0 }
  );

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const markPaid = async (row) => {
    const ref = window.prompt("Payment reference (optional):", row.payment_ref || "");
    if (ref === null) return;
    const notes = window.prompt("Notes (optional):", row.notes || "");
    if (notes === null) return;

    const key = `${row.user_id}-${row.year}-${row.month}`;
    setSavingKey(key);
    try {
      await markPayrollPaid({
        user_id: row.user_id,
        year: row.year,
        month: row.month,
        payment_ref: ref,
        notes,
      });
      await fetchPayroll();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to mark payroll paid.");
    } finally {
      setSavingKey("");
    }
  };

  const markPending = async (row) => {
    const key = `${row.user_id}-${row.year}-${row.month}`;
    setSavingKey(key);
    try {
      await markPayrollPending({
        user_id: row.user_id,
        year: row.year,
        month: row.month,
      });
      await fetchPayroll();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to mark payroll pending.");
    } finally {
      setSavingKey("");
    }
  };

  return (
    <PageWrapper
      title="Reports & Analytics"
      subtitle="Attendance insights, trends, and payroll summary"
      actions={
        <div style={s.headerActions}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.open(attendanceExportUrl({ from: analyticsRange.from, to: analyticsRange.to }))}>
            Export Attendance
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => window.open(payrollExportUrl(params))}>
            Export Payroll
          </button>
        </div>
      }
    >
      <div style={s.filters}>
        <select className="input" value={month} onChange={(e) => setMonth(e.target.value)}>
          {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
            <option key={m} value={String(m)}>
              {m}
            </option>
          ))}
        </select>
        <select className="input" value={year} onChange={(e) => setYear(e.target.value)}>
          {Array.from({ length: 6 }, (_, idx) => now.getFullYear() - idx).map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <input
          className="input"
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          placeholder="Filter payroll by employee name"
        />
        <button className="btn btn-primary" onClick={() => { fetchAnalytics(); fetchPayroll(); }}>
          Apply
        </button>
      </div>

      <div style={s.sectionHeader}>
        <div>
          <p style={s.kicker}>Attendance analytics</p>
          <h2 style={s.sectionTitle}>Monthly insights for {analyticsRange.label}</h2>
        </div>
        <div style={s.sectionMeta}>
          <span style={s.sectionPill}>{analyticsRange.from} to {analyticsRange.to}</span>
        </div>
      </div>

      {analyticsError ? <div style={s.errorBanner}>{analyticsError}</div> : null}

      <div style={s.analyticsStats}>
        <Card label="Employees" value={analytics?.totals?.total_employees ?? 0} />
        <Card label="Active Employees" value={analytics?.totals?.active_employees ?? 0} />
        <Card label="Late Arrivals" value={analytics?.totals?.late_arrivals ?? 0} />
        <Card label="Avg Work Hours" value={`${analytics?.totals?.average_work_hours ?? 0}h`} />
        <Card label="Attendance Rate" value={`${analytics?.totals?.attendance_rate ?? 0}%`} />
      </div>

      <div style={s.analyticsGrid}>
        <div style={s.panel}>
          <div style={s.panelHead}>
            <div>
              <p style={s.panelKicker}>Monthly trend</p>
              <h3 style={s.panelTitle}>Present employees by day</h3>
            </div>
            <span style={s.panelBadge}>{analytics?.monthly_trend?.length || 0} days</span>
          </div>
          {analyticsLoading ? (
            <p style={s.info}>Loading analytics...</p>
          ) : (
            <MonthlyTrendChart data={analytics?.monthly_trend || []} />
          )}
        </div>

        <div style={s.sideStack}>
          <div style={s.panel}>
            <div style={s.panelHead}>
              <div>
                <p style={s.panelKicker}>Weekly snapshot</p>
                <h3 style={s.panelTitle}>Last 7 days</h3>
              </div>
            </div>
            {analyticsLoading ? (
              <p style={s.info}>Loading analytics...</p>
            ) : (
              <WeeklySnapshot data={analytics?.weekly_trend || []} />
            )}
          </div>

          <div style={s.panel}>
            <div style={s.panelHead}>
              <div>
                <p style={s.panelKicker}>Top employees</p>
                <h3 style={s.panelTitle}>By worked hours</h3>
              </div>
            </div>
            {analyticsLoading ? (
              <p style={s.info}>Loading analytics...</p>
            ) : (
              <EmployeeHoursChart data={analytics?.top_employees || []} />
            )}
          </div>
        </div>
      </div>

      <div style={s.sectionHeader}>
        <div>
          <p style={s.kicker}>Payroll reports</p>
          <h2 style={s.sectionTitle}>Monthly payroll summary with payout status</h2>
        </div>
      </div>

      <div style={s.stats}>
        <Card label="Employees" value={rows.length} />
        <Card label="Gross Pay" value={money(totals.gross)} />
        <Card label="Deductions" value={money(totals.deductions)} />
        <Card label="Net Pay" value={money(totals.net)} />
      </div>

      <div style={s.tableWrap}>
        {loading ? (
          <p style={s.info}>Loading payroll...</p>
        ) : error ? (
          <p style={s.error}>{error}</p>
        ) : rows.length === 0 ? (
          <p style={s.info}>No payroll rows found for selected filters.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Employee</th>
                <th style={s.th}>Present Days</th>
                <th style={s.th}>Worked Hours</th>
                <th style={s.th}>Gross</th>
                <th style={s.th}>Deductions</th>
                <th style={s.th}>Net</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Paid At</th>
                <th style={s.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.user_id}-${row.year}-${row.month}`}>
                  <td style={s.td}>{row.employee_name}</td>
                  <td style={s.td}>{row.present_days}/{row.working_days_in_month}</td>
                  <td style={s.td}>{row.worked_hours}</td>
                  <td style={s.td}>{money(row.gross_pay)}</td>
                  <td style={s.td}>{money(row.total_deductions)}</td>
                  <td style={s.td}>{money(row.net_pay)}</td>
                  <td style={s.td}>
                    <span style={row.payout_status === "processed" ? s.statusDone : s.statusPending}>
                      {row.payout_status}
                    </span>
                  </td>
                  <td style={s.td}>{row.paid_at ? new Date(row.paid_at).toLocaleString("en-IN") : "-"}</td>
                  <td style={s.td}>
                    {row.payout_status === "processed" ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={savingKey === `${row.user_id}-${row.year}-${row.month}`}
                        onClick={() => markPending(row)}
                      >
                        Mark Pending
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={savingKey === `${row.user_id}-${row.year}-${row.month}`}
                        onClick={() => markPaid(row)}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
};

const Card = ({ label, value }) => (
  <div style={s.card}>
    <p style={s.cardLabel}>{label}</p>
    <p style={s.cardValue}>{value}</p>
  </div>
);

const MonthlyTrendChart = ({ data }) => {
  if (!data.length) {
    return <p style={s.info}>No attendance data found for this range.</p>;
  }

  const maxPresent = Math.max(...data.map((item) => item.present || 0), 1);

  return (
    <div style={s.monthlyChart}>
      {data.map((item) => {
        const barHeight = Math.max(14, ((item.present || 0) / maxPresent) * 100);
        return (
          <div key={item.date} style={s.chartColumn}>
            <div style={s.chartValue}>{item.present || 0}</div>
            <div style={s.chartBarTrack}>
              <div
                style={{
                  ...s.chartBarFill,
                  height: `${barHeight}%`,
                }}
              />
            </div>
            <div style={s.chartLabel}>
              {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              })}
            </div>
            <div style={s.chartMeta}>
              <span>{item.late || 0} late</span>
              <span>{item.attendance_rate || 0}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const WeeklySnapshot = ({ data }) => {
  if (!data.length) {
    return <p style={s.info}>No weekly data yet.</p>;
  }

  return (
    <div style={s.snapshotList}>
      {data.map((item) => (
        <div key={item.date} style={s.snapshotRow}>
          <div>
            <div style={s.snapshotDate}>
              {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </div>
            <div style={s.snapshotMeta}>
              {item.present || 0} present - {item.late || 0} late
            </div>
          </div>
          <span style={s.snapshotRate}>{item.attendance_rate || 0}%</span>
        </div>
      ))}
    </div>
  );
};

const EmployeeHoursChart = ({ data }) => {
  if (!data.length) {
    return <p style={s.info}>No employee attendance hours yet.</p>;
  }

  const maxHours = Math.max(...data.map((item) => Number(item.worked_hours || 0)), 1);

  return (
    <div style={s.employeeChart}>
      {data.map((item) => {
        const width = Math.max(18, (Number(item.worked_hours || 0) / maxHours) * 100);
        return (
          <div key={item.employee_name} style={s.employeeRow}>
            <div style={s.employeeMeta}>
              <span style={s.employeeName}>{item.employee_name || "-"}</span>
              <span style={s.employeeSub}>{item.present_days || 0} days - {item.late_arrivals || 0} late</span>
            </div>
            <div style={s.employeeTrack}>
              <div
                style={{
                  ...s.employeeFill,
                  width: `${width}%`,
                }}
              />
            </div>
            <span style={s.employeeHours}>{Number(item.worked_hours || 0).toFixed(1)}h</span>
          </div>
        );
      })}
    </div>
  );
};

const s = {
  filters: { display: "grid", gridTemplateColumns: "120px 120px 1fr auto", gap: 10, alignItems: "center" },
  headerActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  kicker: {
    margin: 0,
    color: "var(--accent)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  sectionTitle: {
    margin: "6px 0 0",
    color: "var(--text-primary)",
    fontSize: 20,
    fontWeight: 800,
    fontFamily: "var(--font-display)",
  },
  sectionMeta: { display: "flex", gap: 8, flexWrap: "wrap" },
  sectionPill: {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  },
  errorBanner: {
    padding: "12px 14px",
    background: "var(--danger-dim)",
    border: "1px solid var(--danger-border)",
    color: "var(--danger)",
    borderRadius: "var(--r-md)",
    fontSize: 13,
  },
  analyticsStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  },
  sideStack: { display: "grid", gap: 16 },
  panel: {
    background: "var(--surface-1)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: "16px",
  },
  panelHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  panelKicker: {
    margin: 0,
    color: "var(--text-muted)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  panelTitle: {
    margin: "4px 0 0",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 700,
  },
  panelBadge: {
    background: "var(--accent-dim)",
    border: "1px solid var(--accent-border)",
    color: "var(--accent)",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    whiteSpace: "nowrap",
  },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: 12 },
  card: { background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px" },
  cardLabel: { margin: 0, color: "var(--text-muted)", fontSize: 12 },
  cardValue: { margin: "8px 0 0", color: "var(--text-primary)", fontWeight: 700, fontSize: 20 },
  monthlyChart: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(42px, 1fr))",
    gap: 10,
    alignItems: "end",
    minHeight: 220,
  },
  chartColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    minHeight: 220,
  },
  chartValue: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    color: "var(--text-primary)",
    fontSize: 13,
  },
  chartBarTrack: {
    width: "100%",
    flex: 1,
    minHeight: 140,
    background: "linear-gradient(180deg, rgba(0,212,168,0.08), rgba(0,212,168,0.02))",
    border: "1px solid var(--border)",
    borderRadius: "14px 14px 6px 6px",
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
    padding: "0 6px",
  },
  chartBarFill: {
    width: "100%",
    background: "linear-gradient(180deg, var(--accent), rgba(0,212,168,0.55))",
    borderRadius: "10px 10px 4px 4px",
    minHeight: 8,
  },
  chartLabel: {
    color: "var(--text-secondary)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  },
  chartMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    fontSize: 10,
    color: "var(--text-muted)",
    fontFamily: "var(--font-mono)",
  },
  snapshotList: {
    display: "grid",
    gap: 10,
  },
  snapshotRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-md)",
    background: "var(--surface-2)",
  },
  snapshotDate: {
    color: "var(--text-primary)",
    fontWeight: 700,
    fontSize: 13,
  },
  snapshotMeta: {
    color: "var(--text-muted)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    marginTop: 2,
  },
  snapshotRate: {
    color: "var(--accent)",
    fontWeight: 800,
    fontSize: 15,
    fontFamily: "var(--font-display)",
  },
  employeeChart: {
    display: "grid",
    gap: 12,
  },
  employeeRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 2fr auto",
    gap: 12,
    alignItems: "center",
  },
  employeeMeta: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  employeeName: {
    color: "var(--text-primary)",
    fontWeight: 700,
    fontSize: 13,
    textTransform: "capitalize",
  },
  employeeSub: {
    color: "var(--text-muted)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
  },
  employeeTrack: {
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    overflow: "hidden",
  },
  employeeFill: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, var(--warning), var(--accent))",
  },
  employeeHours: {
    color: "var(--text-primary)",
    fontWeight: 800,
    fontFamily: "var(--font-display)",
    fontSize: 12,
  },
  tableWrap: { background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12 },
  td: { padding: "12px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13 },
  info: { padding: 18, margin: 0, color: "var(--text-muted)" },
  error: { padding: 18, margin: 0, color: "var(--danger)" },
  statusDone: {
    background: "var(--accent-dim)",
    border: "1px solid var(--accent-border)",
    color: "var(--accent)",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: 11,
    textTransform: "capitalize",
  },
  statusPending: {
    background: "var(--warning-dim)",
    border: "1px solid var(--warning-border)",
    color: "var(--warning)",
    borderRadius: "999px",
    padding: "3px 9px",
    fontSize: 11,
    textTransform: "capitalize",
  },
};

export default Reports;
