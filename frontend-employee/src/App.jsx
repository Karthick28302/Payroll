import React from "react";
import { BrowserRouter } from "react-router-dom";
import useEmployeeAuth from "./hooks/useEmployeeAuth";
import EmployeeRoutes from "./routes/EmployeeRoutes";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  const { employee, isAuthenticated, login, logout, loading, bootstrapping } = useEmployeeAuth();

  return (
    <ThemeProvider>
      <BrowserRouter>
        <EmployeeRoutes
          employee={employee}
          isAuthenticated={isAuthenticated}
          loading={loading}
          bootstrapping={bootstrapping}
          login={login}
          logout={logout}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
