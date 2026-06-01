import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyAttendance from "./pages/MyAttendance";
import MySalary from "./pages/MySalary";
import Events from "./pages/Events";
import Holidays from "./pages/Holidays";
import * as employeeService from "./services/employeeService";

jest.mock("./services/employeeService", () => ({
  getMyProfile: jest.fn().mockResolvedValue({
    fullName: "Jane Doe",
    phone: "+91 90000 00000",
    address: "Chennai",
    employeeCode: "EMP1001",
    email: "jane@example.com",
    role: "employee",
    department: "Engineering",
    designation: "Developer",
    joinDate: "2026-05-01",
  }),
  updateMyProfile: jest.fn().mockResolvedValue({
    fullName: "Jane Doe",
    phone: "+91 90000 00000",
    address: "Chennai",
  }),
  getMyAttendance: jest.fn().mockResolvedValue([
    {
      id: 1,
      work_date: "2026-05-01",
      login_time: "2026-05-01T09:00:00Z",
      logout_time: "2026-05-01T18:00:00Z",
      total_hours: "9.00",
      status: "present",
    },
  ]),
  getMySalary: jest.fn().mockResolvedValue([
    {
      id: 1,
      month: 5,
      year: 2026,
      basic_salary: "35000",
      allowances: "5000",
      deductions: "1500",
      net_salary: "38500",
      paid_on: "2026-05-31",
    },
  ]),
  getMyEvents: jest.fn().mockResolvedValue([
    {
      id: 1,
      title: "Townhall",
      description: "Monthly townhall",
      event_date: "2026-05-20",
      event_time: "10:00:00",
      location: "Main Hall",
    },
  ]),
  getMyHolidays: jest.fn().mockResolvedValue([
    {
      id: 1,
      holiday_name: "Labour Day",
      holiday_date: "2026-05-01",
      holiday_type: "public",
    },
  ]),
}));

describe("employee page smoke tests", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("login renders and submits credentials", async () => {
    const onLogin = jest.fn().mockResolvedValue({});

    render(<Login onLogin={onLogin} loading={false} />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/emp1001 or name@company\.com/i), {
      target: { value: "EMP1001" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ identifier: "EMP1001", password: "password123" }));
  });

  test("dashboard renders", () => {
    render(<Dashboard employee={{ fullName: "Jane Doe", employeeCode: "EMP1001", role: "employee", department: "Engineering", shift: "General" }} />);

    expect(screen.getByText(/good (morning|afternoon|evening)/i)).toBeInTheDocument();
    expect(screen.getByText(/employee code/i)).toBeInTheDocument();
    expect(screen.getByText(/quick navigation/i)).toBeInTheDocument();
  });

  test("profile renders and loads data", async () => {
    render(<Profile />);

    expect(await screen.findByRole("heading", { name: /my profile/i })).toBeInTheDocument();
    await waitFor(() => expect(employeeService.getMyProfile).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /edit profile/i })).toBeInTheDocument();
  });

  test("attendance renders", async () => {
    render(<MyAttendance />);

    expect(await screen.findByRole("heading", { name: /my attendance/i })).toBeInTheDocument();
    await waitFor(() => expect(employeeService.getMyAttendance).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  test("salary renders", async () => {
    render(<MySalary />);

    expect(await screen.findByRole("heading", { name: /my salary/i })).toBeInTheDocument();
    await waitFor(() => expect(employeeService.getMySalary).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  test("events renders", async () => {
    render(<Events />);

    expect(await screen.findByRole("heading", { name: /events/i })).toBeInTheDocument();
    await waitFor(() => expect(employeeService.getMyEvents).toHaveBeenCalled());
  });

  test("holidays renders", async () => {
    render(<Holidays />);

    expect(await screen.findByRole("heading", { name: /holidays/i })).toBeInTheDocument();
    await waitFor(() => expect(employeeService.getMyHolidays).toHaveBeenCalled());
  });
});
