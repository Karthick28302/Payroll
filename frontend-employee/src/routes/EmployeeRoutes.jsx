import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import PageTransition from "../components/common/PageTransition";
import EmployeeSidebar from "../components/layout/EmployeeSidebar";
import Topbar from "../components/layout/Topbar";
import Dashboard from "../pages/Dashboard";
import Events from "../pages/Events";
import Holidays from "../pages/Holidays";
import Login from "../pages/Login";
import MyAttendance from "../pages/MyAttendance";
import MySalary from "../pages/MySalary";
import Profile from "../pages/Profile";

const Layout = ({ children, onLogout }) => (
  <div className="app-shell">
    <EmployeeSidebar onLogout={onLogout} />
    <div className="main-area">
      <Topbar />
      <main className="page-content">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  </div>
);

const EmployeeRoutes = ({
  employee,
  isAuthenticated,
  loading,
  bootstrapping,
  login,
  logout,
}) => (
  <Routes>
    <Route
      path="/login"
      element={
        isAuthenticated ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Login onLogin={login} loading={loading || bootstrapping} />
        )
      }
    />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute isAllowed={isAuthenticated} isLoading={bootstrapping}>
          <Layout onLogout={logout}>
            <Dashboard employee={employee} />
          </Layout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/profile"
      element={
        <ProtectedRoute isAllowed={isAuthenticated} isLoading={bootstrapping}>
          <Layout onLogout={logout}>
            <Profile />
          </Layout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/attendance"
      element={
        <ProtectedRoute isAllowed={isAuthenticated} isLoading={bootstrapping}>
          <Layout onLogout={logout}>
            <MyAttendance />
          </Layout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/salary"
      element={
        <ProtectedRoute isAllowed={isAuthenticated} isLoading={bootstrapping}>
          <Layout onLogout={logout}>
            <MySalary />
          </Layout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/events"
      element={
        <ProtectedRoute isAllowed={isAuthenticated} isLoading={bootstrapping}>
          <Layout onLogout={logout}>
            <Events />
          </Layout>
        </ProtectedRoute>
      }
    />

    <Route
      path="/holidays"
      element={
        <ProtectedRoute isAllowed={isAuthenticated} isLoading={bootstrapping}>
          <Layout onLogout={logout}>
            <Holidays />
          </Layout>
        </ProtectedRoute>
      }
    />

    <Route
      path="*"
      element={
        <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
      }
    />
  </Routes>
);

export default EmployeeRoutes;