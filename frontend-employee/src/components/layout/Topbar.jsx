import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES = {
  "/dashboard":  "Dashboard",
  "/profile":    "My Profile",
  "/attendance": "Attendance",
  "/salary":     "My Salary",
  "/events":     "Events",
  "/holidays":   "Holidays",
};

const Topbar = () => {
  const { pathname } = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const title = ROUTE_TITLES[pathname] ?? "Employee Portal";

  const timeStr = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateStr = time.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-route">Employee Portal</span>
        <span className="topbar-title">{title}</span>
      </div>

      <div className="topbar-right">
        <div className="topbar-status">
          <span className="topbar-status-dot" />
          <span className="topbar-status-text">{dateStr} &nbsp;·&nbsp; {timeStr}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
