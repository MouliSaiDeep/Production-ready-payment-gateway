import React, { useEffect, useState } from "react";
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
        },
      );
      setStats(res.data);
    } catch (err) {
      console.error("Stats fetch failed", err);
    }
  };

  if (!merchant) return <div>Loading...</div>;

  // CLEAN RETURN: No Sidebar, No layout wrapper.
  return (
    <div data-test-id="dashboard">
      <h1>Overview</h1>

      <div data-test-id="api-credentials" className="creds-box">
        <div className="cred-row">
          <label className="cred-label">API Key</label>
          <span className="cred-val">{merchant.api_key}</span>
        </div>
        <div className="cred-row" style={{ borderBottom: "none" }}>
          <label className="cred-label">API Secret</label>
          <span className="cred-val">secret_test_xyz789</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Transactions</div>
          <div className="stat-value">{stats.total_transactions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Amount</div>
          <div className="stat-value">
            ₹{(stats.total_amount / 100).toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Success Rate</div>
          <div className="stat-value">{stats.success_rate}%</div>
        </div>
      </div>
    </div>
  );
}
