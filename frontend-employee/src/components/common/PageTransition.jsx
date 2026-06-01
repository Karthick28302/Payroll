import React from "react";
import { useLocation } from "react-router-dom";

/**
 * Re-mounts children on every route change via key prop,
 * which re-triggers CSS animations on .page-content children.
 */
const PageTransition = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
};

export default PageTransition;