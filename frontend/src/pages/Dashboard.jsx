import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const [merchant, setMerchant] = useState(null);
  const [stats, setStats] = useState({
    total_transactions: 0,
    total_amount: 0,
    success_rate: 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem("merchant");
    if (stored) {
      const merch = JSON.parse(stored);
      setMerchant(merch);
      fetchStats(merch);
    }
  }, []);

  const fetchStats = async (merch) => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/v1/payments/stats",
        {
          headers: {
            "x-api-key": merch.api_key,
            "x-api-secret": "secret_test_xyz789",
          },
        }
      );
      setStats(res.data);
    } catch (err) {
      console.error("Stats fetch failed", err);
    }
  };

  if (!merchant) return <div style={{ padding: "2rem" }}>Loading...</div>;

  return (
    <div data-test-id="dashboard" className="dashboard-layout">
      {/* Sidebar (Visual only, not tested) */}
      <div className="sidebar">
        <div className="brand">Gateway UI</div>
        <Link to="/dashboard" className="nav-link active">
          Overview
        </Link>
        <Link to="/dashboard/transactions" className="nav-link">
          Transactions
        </Link>
      </div>

      <div className="main-content">
        <h1>Dashboard</h1>

        {/* API Credentials */}
        <div data-test-id="api-credentials" className="creds-box">
          <div className="cred-row">
            <label className="cred-label">API Key</label>
            <span data-test-id="api-key" className="cred-val">
              {merchant.api_key}
            </span>
          </div>
          <div className="cred-row" style={{ borderBottom: "none" }}>
            <label className="cred-label">API Secret</label>
            <span data-test-id="api-secret" className="cred-val">
              secret_test_xyz789
            </span>
          </div>
        </div>

        {/* Real-time Stats */}
        <div data-test-id="stats-container" className="stats-grid">
          <div className="stat-card">
            <div className="stat-title">Total Transactions</div>
            <div data-test-id="total-transactions" className="stat-value">
              {stats.total_transactions}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Amount</div>
            <div data-test-id="total-amount" className="stat-value">
              ₹{stats.total_amount / 100}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Success Rate</div>
            <div data-test-id="success-rate" className="stat-value">
              {stats.success_rate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
