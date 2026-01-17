import React from "react";

export default function ApiDocs() {
  return (
    <div
      style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "4rem" }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          API Reference
        </h1>
        <p style={{ color: "#6b7280" }}>
          Base URL: <code style={codeStyle}>http://localhost:8000/api/v1</code>
        </p>
      </div>

      {/* --- SECTION 1: SYSTEM & AUTH --- */}
      <Section
        title="System & Auth"
        description="Health checks and setup verification."
      >
        <Endpoint method="GET" path="/health" />
        <p>Checks if the API and Database are running.</p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="GET" path="/api/v1/test/merchant" />
        <p>
          Verifies the database seeding and returns the test merchant
          credentials.
        </p>
      </Section>

      {/* --- SECTION 2: ORDERS --- */}
      <Section
        title="Orders"
        description="Manage payment intents (Deliverable 1)."
      >
        <Endpoint method="POST" path="/orders" />
        <p>Create a new order. Required before attempting a payment.</p>
        <pre style={blockStyle}>
          {`{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_1"
}`}
        </pre>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="GET" path="/orders/:id" />
        <p>Fetch details of a specific order (Private).</p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="GET" path="/orders/:id/public" />
        <p>
          <strong>Public:</strong> Fetch order details for the Checkout Page (No
          Auth required).
        </p>
      </Section>

      {/* --- SECTION 3: PAYMENTS --- */}
      <Section
        title="Payments"
        description="Process transactions and retrieve history."
      >
        <Endpoint method="POST" path="/payments" />
        <p>Process a payment (S2S). Supports `card` or `upi` methods.</p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="POST" path="/payments/public" />
        <p>
          <strong>Public:</strong> Process payment from Checkout Page (No Auth
          required).
        </p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="GET" path="/payments" />
        <p>List all payments for the authenticated merchant.</p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="GET" path="/payments/:id" />
        <p>Get the status of a specific payment.</p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="GET" path="/payments/stats" />
        <p>Get dashboard statistics (Total volume, success rate, etc.).</p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="POST" path="/payments/:id/capture" />
        <p>Capture a payment (if authorized separately).</p>
      </Section>

      {/* --- SECTION 4: REFUNDS (Deliverable 2) --- */}
      <Section title="Refunds" description="Manage refunds and reversals.">
        <Endpoint method="POST" path="/payments/:id/refund" />
        <p>Initiate a full or partial refund for a successful payment.</p>
        <pre style={blockStyle}>
          {`{
  "amount": 1000,
  "reason": "Customer requested"
}`}
        </pre>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="GET" path="/refunds/:id" />
        <p>Get details of a specific refund ID.</p>
      </Section>

      {/* --- SECTION 5: WEBHOOKS (Deliverable 2) --- */}
      <Section
        title="Webhooks"
        description="Configure and manage event notifications."
      >
        <Endpoint method="GET" path="/webhooks" />
        <p>List recent webhook delivery logs.</p>

        <div style={{ marginTop: "1.5rem" }}></div>
        <Endpoint method="POST" path="/webhooks/:id/retry" />
        <p>Manually retry a failed webhook delivery.</p>
      </Section>

      {/* --- SECTION 6: TESTING --- */}
      <Section title="Testing" description="Internal tools for simulation.">
        <Endpoint method="GET" path="/test/jobs/status" />
        <p>Check the health of the background worker queues.</p>
      </Section>
    </div>
  );
}

// --- Helper Components ---

const Section = ({ title, description, children }) => (
  <div
    className="checkout-card"
    style={{ marginBottom: "2rem", padding: "2rem" }}
  >
    <h2 style={{ marginTop: 0, fontSize: "1.25rem", color: "#111827" }}>
      {title}
    </h2>
    <p
      style={{
        color: "#6b7280",
        marginBottom: "1.5rem",
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: "1rem",
      }}
    >
      {description}
    </p>
    {children}
  </div>
);

const Endpoint = ({ method, path }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "0.5rem",
    }}
  >
    <span
      style={{
        background:
          method === "GET"
            ? "#dbeafe"
            : method === "POST"
              ? "#dcfce7"
              : "#f3f4f6",
        color:
          method === "GET"
            ? "#1e40af"
            : method === "POST"
              ? "#166534"
              : "#374151",
        fontWeight: "bold",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "0.875rem",
        minWidth: "60px",
        textAlign: "center",
      }}
    >
      {method}
    </span>
    <code
      style={{ fontFamily: "monospace", fontSize: "1rem", color: "#111827" }}
    >
      {path}
    </code>
  </div>
);

const codeStyle = {
  background: "#e5e7eb",
  padding: "2px 6px",
  borderRadius: "4px",
  fontFamily: "monospace",
};

const blockStyle = {
  background: "#1f2937",
  color: "#f3f4f6",
  padding: "1rem",
  borderRadius: "8px",
  overflowX: "auto",
  fontFamily: "monospace",
  fontSize: "0.875rem",
};
