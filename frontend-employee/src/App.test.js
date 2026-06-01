import React from "react";
import { render, screen } from "@testing-library/react";
import Login from "./pages/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";

jest.mock(
  "react-router-dom",
  () => ({
    Navigate: ({ to }) => <div data-testid="navigate-to">{to}</div>,
  }),
  { virtual: true }
);

describe("employee frontend smoke tests", () => {
  test("renders the login form", () => {
    render(<Login onLogin={jest.fn()} loading={false} />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in to your employee account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("redirects protected routes to login when unauthorized", () => {
    render(
      <ProtectedRoute isAllowed={false} isLoading={false}>
        <div>Dashboard Screen</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId("navigate-to")).toHaveTextContent("/login");
  });
});
