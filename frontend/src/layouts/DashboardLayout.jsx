import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function DashboardLayout({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname.split("/")[2] || "dashboard";

  const handleNav = (path) => {
    navigate(path);
  };

  const navItems = [
    { id: "dashboard", label: "Overview", path: "/dashboard" },
    { id: "transactions", label: "Transactions", path: "/transactions" },
    { id: "webhooks", label: "Webhooks", path: "/webhooks" },
    { id: "docs", label: "API Docs", path: "/api-docs" },
  ];

  return (
    <div className="app-container">
      {/* --- TOP TAB BAR --- */}
      <div className="tab-nav-container">
        <div className="brand">Gateway UI</div>

        <div className="tabs-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.path)}
              className={`tab-btn ${location.pathname === item.path ? "active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* --- PAGE CONTENT --- */}
      <div className="content-wrapper">
        <Outlet />
      </div>
    </div>
  );
}
