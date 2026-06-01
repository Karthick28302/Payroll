import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./pages/Dashboard";
import AttendanceRecords from "./pages/AttendanceRecords";
import Employees from "./pages/Employees";
import RegisterUser from "./pages/RegisterUser";
import LiveMonitoring from "./pages/LiveMonitoring";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CCTVSetup from "./pages/CCTVSetup";
import * as cameraService from "./services/cameraService";

jest.mock("./hooks/useAuth", () => ({
  __esModule: true,
  default: jest.fn(() => undefined),
}));
jest.mock("./hooks/useAttendance", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    records: [
      { name: "john doe", login_time: "2026-05-01T09:00:00Z", logout_time: null },
      { name: "jane smith", login_time: "2026-05-01T09:15:00Z", logout_time: "2026-05-01T18:00:00Z" },
    ],
    stats: { total_today: 2, currently_present: 1 },
    loading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));
jest.mock("./components/layout/PageWrapper", () => {
  return function MockPageWrapper({ title, subtitle, actions, children }) {
    return (
      <div>
        {title ? <h1>{title}</h1> : null}
        {subtitle ? <p>{subtitle}</p> : null}
        {actions}
        {children}
      </div>
    );
  };
});
jest.mock("./services/cameraService", () => ({
  getCameraStatus: jest.fn().mockResolvedValue({ available: true, opened: true, message: "ok" }),
  videoFeedUrl: jest.fn(() => "https://example.com/feed"),
  getCameraSources: jest.fn().mockResolvedValue([]),
  getCameraHealthLogs: jest.fn().mockResolvedValue([]),
  getCameraRecordings: jest.fn().mockResolvedValue([]),
  getRecordingStatus: jest.fn().mockResolvedValue({ recording: false }),
  startRecording: jest.fn().mockResolvedValue({ message: "Recording started" }),
  stopRecording: jest.fn().mockResolvedValue({ message: "Recording stopped" }),
  activateCameraSource: jest.fn().mockResolvedValue({}),
  createCameraSource: jest.fn().mockResolvedValue({}),
  deleteCameraSource: jest.fn().mockResolvedValue({}),
  testCameraSource: jest.fn().mockResolvedValue({ message: "ok" }),
  updateCameraSource: jest.fn().mockResolvedValue({}),
  releaseBackendCamera: jest.fn().mockResolvedValue({}),
}));
jest.mock("./services/userService", () => ({
  registerFace: jest.fn().mockResolvedValue({ message: "ok" }),
  retryEmployeeSync: jest.fn().mockResolvedValue({ message: "ok" }),
  getUsers: jest.fn().mockResolvedValue([
    { id: 1, name: "john doe", monthly_salary: 50000, pf_percent: 12, savings_percent: 10 },
  ]),
  getUserDetails: jest.fn().mockResolvedValue({
    user: { id: 1, name: "john doe", created_at: "2026-05-01T00:00:00Z", monthly_salary: 50000, pf_percent: 12, savings_percent: 10 },
    summary: { total_records: 2, today_records: 1, currently_present: 1 },
  }),
  updateCompensation: jest.fn().mockResolvedValue({}),
  deleteUser: jest.fn().mockResolvedValue({}),
  clearFaceEncodings: jest.fn().mockResolvedValue({ message: "All face encodings cleared" }),
  resetAttendanceRecords: jest.fn().mockResolvedValue({ message: "All attendance records deleted", deleted: 0 }),
}));
jest.mock("./services/payrollService", () => ({
  getPayrollSummary: jest.fn().mockResolvedValue({
    rows: [
      {
        user_id: 1,
        employee_name: "john doe",
        present_days: 20,
        working_days_in_month: 22,
        worked_hours: 160,
        gross_pay: 50000,
        total_deductions: 5000,
        net_pay: 45000,
        payout_status: "pending",
        paid_at: null,
        year: 2026,
        month: 5,
      },
    ],
  }),
  payrollExportUrl: jest.fn(() => "https://example.com/payroll-export"),
  markPayrollPaid: jest.fn().mockResolvedValue({}),
  markPayrollPending: jest.fn().mockResolvedValue({}),
}));
jest.mock("./services/attendanceService", () => ({
  exportUrl: jest.fn(() => "https://example.com/attendance-export"),
  getAttendanceAnalytics: jest.fn().mockResolvedValue({
    totals: {
      total_employees: 1,
      active_employees: 1,
      late_arrivals: 0,
      average_work_hours: 8,
      attendance_rate: 100,
      records: 2,
    },
    monthly_trend: [],
    weekly_trend: [],
    top_employees: [],
  }),
}));

describe("admin page smoke tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [] }) },
      configurable: true,
    });
    window.confirm = jest.fn(() => true);
    window.open = jest.fn();
    window.prompt = jest.fn(() => "");
  });

  test("dashboard renders with primary actions", async () => {
    render(<Dashboard />);

    expect(await screen.findByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export excel/i })).toBeInTheDocument();
    await waitFor(() => expect(cameraService.getCameraStatus).toHaveBeenCalled());
    expect(cameraService.videoFeedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ view: "dashboard" })
    );
  });

  test("attendance records renders", async () => {
    render(<AttendanceRecords />);

    expect(await screen.findByRole("heading", { name: /attendance records/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export excel/i })).toBeInTheDocument();
  });

  test("employees page renders", async () => {
    render(<Employees />);

    expect(await screen.findByRole("heading", { name: /^employees$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
    expect(screen.getByText(/payroll and admin actions/i)).toBeInTheDocument();
  });

  test("register user page renders", async () => {
    render(<RegisterUser />);

    expect(await screen.findByRole("heading", { name: /register new employee/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /capture & register/i })).toBeInTheDocument();
  });

  test("live monitoring page renders", async () => {
    render(<LiveMonitoring />);

    expect(await screen.findByRole("heading", { name: /live monitoring/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
    expect(cameraService.videoFeedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ view: "monitor" })
    );
  });

  test("live monitoring shows reconnect state after a stream error", async () => {
    render(<LiveMonitoring />);

    const feed = await screen.findByAltText(/live camera feed/i);
    fireEvent.error(feed);

    expect(await screen.findByText(/reconnecting/i)).toBeInTheDocument();
  });

  test("register user can switch camera source and render the backend stream", async () => {
    render(<RegisterUser />);

    expect(await screen.findByRole("heading", { name: /register new employee/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /backend stream/i }));

    expect(screen.getByAltText("camera")).toBeInTheDocument();
    expect(cameraService.releaseBackendCamera).toHaveBeenCalled();
  });

  test("route switching between live monitor and register user does not crash", async () => {
    const { rerender } = render(<LiveMonitoring />);

    expect(await screen.findByRole("heading", { name: /live monitoring/i })).toBeInTheDocument();

    rerender(<RegisterUser />);

    expect(await screen.findByRole("heading", { name: /register new employee/i })).toBeInTheDocument();
  });

  test("reports page renders", async () => {
    render(<Reports />);

    expect(await screen.findByRole("heading", { name: /reports & analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export attendance/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export payroll/i })).toBeInTheDocument();
  });

  test("settings page renders", async () => {
    render(<Settings />);

    expect(await screen.findByRole("heading", { name: /^settings$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear encodings/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset records/i })).toBeInTheDocument();
  });

  test("cctv setup page renders", async () => {
    render(<CCTVSetup />);

    expect(await screen.findByRole("heading", { name: /cctv setup/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add source/i })).toBeInTheDocument();
  });
});
