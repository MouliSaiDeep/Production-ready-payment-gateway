import React from "react";
import { useNavigate } from "react-router-dom";

export default function NavBar({ activeTab, setActiveTab, onLogout }) {
  const navigate = useNavigate();

  const handleNav = (tab, path) => {
    setActiveTab(tab);
    navigate(path);
  };

  const navItems = [
    { id: "dashboard", label: "Overview", path: "/dashboard" },
    { id: "transactions", label: "Transactions", path: "/transactions" },
    { id: "webhooks", label: "Webhooks", path: "/webhooks" },
    { id: "docs", label: "API Docs", path: "/api-docs" },
  ];

  return (
    <div className="tab-nav-container">
      <div className="brand">Gateway UI</div>

      <div className="tabs-list">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id, item.path)}
            className={`tab-btn ${activeTab === item.id ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button onClick={onLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
}
