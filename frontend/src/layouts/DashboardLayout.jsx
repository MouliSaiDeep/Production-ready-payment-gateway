import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="brand">Gateway UI</div>
        <Link to="/dashboard" className={isActive("/dashboard")}>
          Overview
        </Link>
        <Link
          to="/dashboard/webhooks"
          className={isActive("/dashboard/webhooks")}
        >
          Webhooks
        </Link>
        <Link to="/dashboard/docs" className={isActive("/dashboard/docs")}>
          Integration Docs
        </Link>
      </div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
