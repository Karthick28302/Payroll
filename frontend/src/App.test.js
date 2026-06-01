import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import PrivateRoute from "./routes/PrivateRoute";
import useAuth from "./hooks/useAuth";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    Navigate: ({ to }) => <div data-testid="navigate-to">{to}</div>,
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

describe("admin frontend smoke tests", () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  test("redirects to login when the admin session is missing", () => {
    render(
      <PrivateRoute>
        <div>Dashboard Screen</div>
      </PrivateRoute>
    );

    expect(screen.getByTestId("navigate-to").textContent).toBe("/login");
  });

  test("renders protected content when the admin session is valid", () => {
    localStorage.setItem("admin_token", "token-123");
    localStorage.setItem(
      "admin_user",
      JSON.stringify({ username: "admin", role: "admin" })
    );

    render(
      <PrivateRoute>
        <div>Dashboard Screen</div>
      </PrivateRoute>
    );

    expect(screen.getByText("Dashboard Screen")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate-to")).toBeNull();
  });

  test("useAuth redirects to login when the session is invalid", async () => {
    function Probe() {
      useAuth();
      return <div>Probe</div>;
    }

    render(<Probe />);

    expect(await screen.findByText("Probe")).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
