import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api/v1";

export default function WebhookConfig() {
  const [logs, setLogs] = useState([]);
  const [url, setUrl] = useState("");
  const navigate = useNavigate();



  const fetchLogs = async () => {
    try {
      // 1. Get the Key from Local Storage
      const storedMerchant = localStorage.getItem("merchant");

      if (!storedMerchant) {
        alert("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      const merchant = JSON.parse(storedMerchant);

      if (!merchant.api_key) {
        throw new Error("API Key missing from session.");
      }

      // 2. Fetch Logs with BOTH Key and Secret
      const res = await axios.get(`${API_BASE}/webhooks`, {
        headers: {
          "x-api-key": merchant.api_key,
          // FIX: We must include the secret. Since the Login API doesn't return it,
          // we use the known test secret for this environment.
          "x-api-secret": "secret_test_xyz789",
        },
      });

      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      if (err.response && err.response.status === 401) {
        alert(
          "Authentication Failed. The backend rejected your API Key/Secret.",
        );
      }
    }
  };

  const retryWebhook = async (id) => {
    try {
      const storedMerchant = localStorage.getItem("merchant");
      const { api_key } = JSON.parse(storedMerchant);

      await axios.post(
        `${API_BASE}/webhooks/${id}/retry`,
        {},
        {
          headers: {
            "x-api-key": api_key,
            "x-api-secret": "secret_test_xyz789",
          },
        },
      );
      alert("Retry scheduled!");
      setTimeout(fetchLogs, 1000);
    } catch (err) {
      alert("Retry failed");
    }
  };

  const fetchConfig = async () => {
    try {
      const storedMerchant = localStorage.getItem("merchant");
      const { api_key } = JSON.parse(storedMerchant);
      const res = await axios.get(`${API_BASE}/merchant`, {
        headers: { "x-api-key": api_key, "x-api-secret": "secret_test_xyz789" }
      });
      setUrl(res.data.webhook_url || "");
      // You could also fetch secret here if needed
    } catch (err) {
      console.error("Failed to fetch config");
    }
  };

  const saveConfig = async () => {
    try {
      const storedMerchant = localStorage.getItem("merchant");
      const { api_key } = JSON.parse(storedMerchant);
      await axios.put(`${API_BASE}/merchant`, { webhook_url: url }, {
        headers: { "x-api-key": api_key, "x-api-secret": "secret_test_xyz789" }
      });
      alert("Configuration saved!");
      fetchLogs(); // Refresh logs potentially
    } catch (err) {
      alert("Failed to save configuration");
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchConfig();
  }, []);

  // ... (keep fetchLogs) ...

  // ... (keep retryWebhook) ...

  // --- UI RENDER ---
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* ... (Header) ... */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", color: "#111827", margin: 0 }}>
          Webhooks
        </h1>
        <button
          className="action-btn"
          onClick={fetchLogs}
        >
          Refresh Logs
        </button>
      </div>

      <div
        className="checkout-card"
        style={{ marginBottom: "2rem", padding: "2rem" }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "1.5rem", color: "#374151" }}>
          Configuration
        </h3>
        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
                color: "#4b5563",
              }}
            >
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhooks"
              className="input-field"
            />
          </div>
          <div>
            <button
              className="action-btn primary"
              onClick={saveConfig}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: "1rem", color: "#374151" }}>
        Recent Deliveries
      </h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Event</th>
              <th>Time</th>
              <th>Attempts</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span
                    className={`status-badge ${log.status === "success" ? "status-success" : "status-failed"}`}
                  >
                    {log.status === "success" ? "Delivered" : "Failed"}
                  </span>
                </td>
                <td>{log.event}</td>
                <td>
                  {new Date(
                    log.created_at || log.last_attempt,
                  ).toLocaleString()}
                </td>
                <td>{log.attempts}</td>
                <td style={{ maxWidth: '200px', fontSize: '0.8rem', color: '#ef4444' }}>
                  {log.status !== 'success' && log.response_body && (
                    <span>{log.response_body.substring(0, 50)}...</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => retryWebhook(log.id)}
                    className="action-btn"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No webhook events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
