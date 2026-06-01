import React from "react";
import { Navigate } from "react-router-dom";
import { isAdminSessionValid } from "../utils/auth";

const PrivateRoute = ({ children }) => {
  if (!isAdminSessionValid()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default PrivateRoute;
