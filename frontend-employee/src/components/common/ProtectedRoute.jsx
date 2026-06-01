import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ isAllowed, isLoading = false, children }) => {
  if (isLoading) {
    return (
      <div className="boot-screen">
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <p>Authenticating…</p>
      </div>
    );
  }
  if (!isAllowed) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
