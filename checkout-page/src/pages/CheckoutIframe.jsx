import React, { useState, useEffect } from "react";
import axios from "axios";
import "../index.css";

const API_BASE = "http://localhost:8000/api/v1";

// --- OLD UI ICONS ---
const CardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const UpiIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const CheckCircle = () => (
  <svg
    className="success-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const XCircle = () => (
  <svg
    className="error-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default function CheckoutIframe() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualOrderId, setManualOrderId] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [paymentState, setPaymentState] = useState("initial");
  const [paymentResult, setPaymentResult] = useState(null);
  const [vpa, setVpa] = useState("");
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const queryParams = new URLSearchParams(window.location.search);
  const urlOrderId = queryParams.get("order_id");

  useEffect(() => {
    if (urlOrderId) {
      fetchOrder(urlOrderId);
    } else {
      setLoading(false);
    }
  }, [urlOrderId]);

  // Create Test Order
  const createTestOrder = async () => {
    try {
      setLoading(true);
      const amount = Math.floor(Math.random() * (500000 - 50000 + 1) + 50000);
      const res = await axios.post(
        `${API_BASE}/orders`,
        { amount: amount, currency: "INR" },
        {
          headers: {
            "x-api-key": "key_test_abc123",
            "x-api-secret": "secret_test_xyz789",
          },
        },
      );
      setManualOrderId(res.data.id);
      fetchOrder(res.data.id);
    } catch (err) {
      setError("Failed to create test order. Check Worker/API.");
      setLoading(false);
    }
  };

  const fetchOrder = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/orders/${id}/public`);
      setOrder(res.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("Order not found.");
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentState("processing");

    try {
      const payload = { order_id: order.id, method: selectedMethod };
      if (selectedMethod === "upi") {
        payload.vpa = vpa;
      } else {
        const [month, year] = cardData.expiry.includes("/")
          ? cardData.expiry.split("/")
          : ["12", "30"];
        payload.card = {
          number: cardData.number,
          expiry_month: month,
          // FIX: Automatically convert "26" to "2026" for the API
          expiry_year: year.length === 2 ? "20" + year : year,
          cvv: cardData.cvv,
          holder_name: cardData.name,
        };
      }

      const res = await axios.post(`${API_BASE}/payments/public`, payload);
      pollPaymentStatus(res.data.id);
    } catch (err) {
      console.error("Payment API Error:", err);
      setPaymentState("failed");
    }
  };

  const pollPaymentStatus = (paymentId) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await axios.get(`${API_BASE}/payments/${paymentId}`);
        const status = res.data.status;
        if (status === "success") {
          clearInterval(interval);
          setPaymentResult(res.data);
          setPaymentState("success");
        } else if (status === "failed" || attempts > 10) {
          clearInterval(interval);
          setPaymentState("failed");
        }
      } catch (err) {
        clearInterval(interval);
        setPaymentState("failed");
      }
    }, 2000);
  };

  if (loading)
    return (
      <div className="app-container">
        <div className="spinner"></div>
      </div>
    );

  // --- UI RENDER (Exact Old UI) ---
  if (!order) {
    return (
      <div
        className="app-container checkout-card"
        style={{ textAlign: "center" }}
      >
        <h2>Payment Portal</h2>
        <p className="label">Enter an Order ID to continue</p>
        {error && (
          <p style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</p>
        )}
        <div className="input-group">
          <input
            placeholder="e.g. order_123abc"
            value={manualOrderId}
            onChange={(e) => setManualOrderId(e.target.value)}
            style={{ textAlign: "center" }}
          />
        </div>
        <button
          className="pay-btn"
          onClick={() => fetchOrder(manualOrderId)}
          disabled={!manualOrderId}
        >
          Find Order
        </button>
        <div
          style={{
            marginTop: "1.5rem",
            borderTop: "1px dashed #ccc",
            paddingTop: "1.5rem",
          }}
        >
          <p className="label" style={{ marginBottom: "0.5rem" }}>
            No Order ID? (For Testing)
          </p>
          <button
            onClick={createTestOrder}
            style={{
              background: "#fff",
              border: "1px solid #ccc",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ✨ Generate Test Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-test-id="checkout-container" className="checkout-card">
      <div data-test-id="order-summary">
        <h2>Complete Payment</h2>
        <div className="summary-row">
          <span className="label">Amount to Pay</span>
          <span className="value" data-test-id="order-amount">
            ₹{(order.amount / 100).toFixed(2)}
          </span>
        </div>
        <div className="summary-row" style={{ borderBottom: "none" }}>
          <span className="label">Order Reference</span>
          <span className="id-badge" data-test-id="order-id">
            {order.id}
          </span>
        </div>
      </div>

      {paymentState === "initial" && (
        <>
          <div data-test-id="payment-methods" className="method-grid">
            <button
              className={`method-btn ${selectedMethod === "card" ? "active" : ""}`}
              data-test-id="method-card"
              onClick={() => setSelectedMethod("card")}
            >
              <CardIcon />
              <span>Card</span>
            </button>
            <button
              className={`method-btn ${selectedMethod === "upi" ? "active" : ""}`}
              data-test-id="method-upi"
              onClick={() => setSelectedMethod("upi")}
            >
              <UpiIcon />
              <span>UPI</span>
            </button>
          </div>
          {selectedMethod === "upi" && (
            <form
              data-test-id="upi-form"
              onSubmit={handlePayment}
              className="animate-fade"
            >
              <div className="input-group">
                <input
                  data-test-id="vpa-input"
                  placeholder="username@bank"
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  required
                />
              </div>
              <button
                data-test-id="pay-button"
                type="submit"
                className="pay-btn"
              >
                Pay Securely
              </button>
            </form>
          )}
          {selectedMethod === "card" && (
            <form
              data-test-id="card-form"
              onSubmit={handlePayment}
              className="animate-fade"
            >
              <div className="input-group">
                <input
                  data-test-id="card-number-input"
                  placeholder="Card Number"
                  value={cardData.number}
                  onChange={(e) =>
                    setCardData({ ...cardData, number: e.target.value })
                  }
                  required
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <input
                  data-test-id="expiry-input"
                  placeholder="MM/YY"
                  value={cardData.expiry}
                  onChange={(e) =>
                    setCardData({ ...cardData, expiry: e.target.value })
                  }
                  required
                />
                <input
                  data-test-id="cvv-input"
                  placeholder="CVV"
                  value={cardData.cvv}
                  onChange={(e) =>
                    setCardData({ ...cardData, cvv: e.target.value })
                  }
                  required
                />
              </div>
              <div className="input-group">
                <input
                  data-test-id="cardholder-name-input"
                  placeholder="Cardholder Name"
                  value={cardData.name}
                  onChange={(e) =>
                    setCardData({ ...cardData, name: e.target.value })
                  }
                  required
                />
              </div>
              <button
                data-test-id="pay-button"
                type="submit"
                className="pay-btn"
              >
                Pay Securely
              </button>
            </form>
          )}
        </>
      )}

      {paymentState === "processing" && (
        <div data-test-id="processing-state" className="state-container">
          <div className="spinner"></div>
          <p data-test-id="processing-message" className="label">
            Processing secure payment...
          </p>
          <p className="label" style={{ fontSize: "0.8rem" }}>
            Please do not close this window
          </p>
        </div>
      )}

      {paymentState === "success" && (
        <div data-test-id="success-state" className="state-container">
          <CheckCircle />
          <h2>Payment Successful!</h2>
          <p className="label" style={{ marginBottom: "0.5rem" }}>
            Payment ID
          </p>
          <span className="id-badge" data-test-id="payment-id">
            {paymentResult?.id}
          </span>
          <p
            data-test-id="success-message"
            style={{ marginTop: "1.5rem", color: "#111827" }}
          >
            Your transaction has been completed.
          </p>
        </div>
      )}

      {paymentState === "failed" && (
        <div data-test-id="error-state" className="state-container">
          <XCircle />
          <h2 style={{ color: "#ef4444" }}>Payment Failed</h2>
          <p data-test-id="error-message" className="label">
            The transaction could not be processed.
          </p>
          <button
            data-test-id="retry-button"
            className="retry-btn"
            onClick={() => setPaymentState("initial")}
          >
            Try Another Method
          </button>
        </div>
      )}
    </div>
  );
}
