import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000/api/v1";

export default function WebhookConfig() {
  const [logs, setLogs] = useState([]);
  const [url, setUrl] = useState("https://example.com/webhook");
  const [secret, setSecret] = useState(
    "whsec_" + Math.random().toString(36).substring(7)
  );

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/webhooks`, {
        headers: { "x-api-key": "key_test_abc123" },
      });
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
  };

  const retryWebhook = async (id) => {
    try {
      await axios.post(
        `${API_BASE}/webhooks/${id}/retry`,
        {},
        {
          headers: { "x-api-key": "key_test_abc123" },
        }
      );
      alert("Retry scheduled!");
      fetchLogs();
    } catch (err) {
      alert("Retry failed");
    }
  };

  return (
    <div data-test-id="webhook-config">
      <h2>Webhook Configuration</h2>

      <div className="checkout-card" style={{ marginBottom: "2rem" }}>
        <form
          data-test-id="webhook-config-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="input-group">
            <label className="label">Webhook URL</label>
            <input
              data-test-id="webhook-url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yoursite.com/webhook"
            />
          </div>

          <div className="input-group">
            <label className="label">Webhook Secret</label>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <span data-test-id="webhook-secret" className="id-badge">
                {secret}
              </span>
              <button
                data-test-id="regenerate-secret-button"
                className="retry-btn"
                onClick={() =>
                  setSecret("whsec_" + Math.random().toString(36).substring(7))
                }
              >
                Regenerate
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              data-test-id="save-webhook-button"
              className="pay-btn"
              style={{ width: "auto" }}
              type="submit"
            >
              Save Configuration
            </button>
            <button
              data-test-id="test-webhook-button"
              className="method-btn"
              type="button"
            >
              Send Test Webhook
            </button>
          </div>
        </form>
      </div>

      <h3>Webhook Logs</h3>
      <div className="table-container checkout-card" style={{ padding: "0" }}>
        <table
          data-test-id="webhook-logs-table"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead
            style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}
          >
            <tr>
              <th style={thStyle}>Event</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Attempts</th>
              <th style={thStyle}>Last Attempt</th>
              <th style={thStyle}>Response Code</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr
                key={log.id}
                data-test-id="webhook-log-item"
                data-webhook-id={log.id}
                style={{ borderBottom: "1px solid #e5e7eb" }}
              >
                <td style={tdStyle} data-test-id="webhook-event">
                  {log.event}
                </td>
                <td style={tdStyle} data-test-id="webhook-status">
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.85rem",
                      background:
                        log.status === "success" ? "#dcfce7" : "#fee2e2",
                      color: log.status === "success" ? "#166534" : "#991b1b",
                    }}
                  >
                    {log.status}
                  </span>
                </td>
                <td style={tdStyle} data-test-id="webhook-attempts">
                  {log.attempts}
                </td>
                <td style={tdStyle} data-test-id="webhook-last-attempt">
                  {new Date(log.last_attempt).toLocaleString()}
                </td>
                <td style={tdStyle} data-test-id="webhook-response-code">
                  {log.response_code || "-"}
                </td>
                <td style={tdStyle}>
                  <button
                    data-test-id="retry-webhook-button"
                    data-webhook-id={log.id}
                    className="retry-btn"
                    style={{ margin: 0, padding: "4px 12px" }}
                    onClick={() => retryWebhook(log.id)}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No webhook logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "1rem",
  textAlign: "left",
  fontSize: "0.875rem",
  color: "#6b7280",
  fontWeight: 500,
};
const tdStyle = { padding: "1rem", fontSize: "0.875rem", color: "#111827" };
