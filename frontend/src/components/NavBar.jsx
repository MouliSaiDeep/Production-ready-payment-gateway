import React from "react";
import { Link, useNavigate } from "react-router-dom";

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
    <nav
      style={{
        width: "250px",
        background: "#1e293b",
        color: "white",
        height: "100vh",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ marginBottom: "2rem" }}>Gateway UI</h2>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNav(item.id, item.path)}
          style={{
            padding: "12px",
            textAlign: "left",
            background: activeTab === item.id ? "#334155" : "transparent",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginBottom: "5px",
            borderRadius: "4px",
          }}
        >
          {item.label}
        </button>
      ))}
      <button
        onClick={onLogout}
        style={{
          marginTop: "auto",
          background: "#ef4444",
          color: "white",
          border: "none",
          padding: "12px",
          cursor: "pointer",
          borderRadius: "4px",
        }}
      >
        Logout
      </button>
    </nav>
  );
}
