import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Transactions() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const stored = localStorage.getItem("merchant");
      if (!stored) return;
      const merchant = JSON.parse(stored);

      const res = await axios.get("http://localhost:8000/api/v1/payments", {
        headers: {
          "x-api-key": merchant.api_key,
          "x-api-secret": "secret_test_xyz789",
        },
      });
      setPayments(res.data);
    } catch (err) {
      console.error("Failed to fetch transactions");
    }
  };

  // ... inside Transactions function ...
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);

  // ... fetchTransactions unchanged ...

  const handleCapture = async (id) => {
    try {
      const stored = localStorage.getItem("merchant");
      const merchant = JSON.parse(stored);
      await axios.post(`http://localhost:8000/api/v1/payments/${id}/capture`, {}, {
        headers: { "x-api-key": merchant.api_key, "x-api-secret": "secret_test_xyz789" }
      });
      alert("Payment captured!");
      fetchTransactions();
    } catch (err) {
      alert("Capture failed: " + (err.response?.data?.error?.description || err.message));
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    try {
      const stored = localStorage.getItem("merchant");
      const merchant = JSON.parse(stored);
      await axios.post(`http://localhost:8000/api/v1/payments/${selectedPayment}/refunds`, {
        amount: parseInt(refundAmount)
      }, {
        headers: { "x-api-key": merchant.api_key, "x-api-secret": "secret_test_xyz789" }
      });
      alert("Refund initiated!");
      setShowRefundModal(false);
      setRefundAmount("");
      fetchTransactions();
    } catch (err) {
      alert("Refund failed: " + (err.response?.data?.error?.description || err.message));
    }
  };

  return (
    <div>
      <h1>Transactions</h1>

      <div className="table-container">
        <table data-test-id="transactions-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} data-test-id="transaction-row" data-payment-id={p.id}>
                <td data-test-id="payment-id">{p.id}</td>
                <td data-test-id="order-id">{p.order_id}</td>
                <td data-test-id="amount">₹{(p.amount / 100).toFixed(2)}</td>
                <td data-test-id="method">{p.method}</td>
                <td data-test-id="status">
                  <span className={`status-badge ${p.status === "success" ? "status-success" : "status-failed"}`}>
                    {p.status}
                  </span>
                  {p.status === 'success' && p.captured && <span style={{ marginLeft: '5px', fontSize: '0.8em' }}>Captured</span>}
                </td>
                <td data-test-id="created-at">
                  {new Date(p.created_at).toISOString().split("T")[0]}
                </td>
                <td>
                  {p.status === 'success' && !p.captured && (
                    <button className="action-btn" onClick={() => handleCapture(p.id)} style={{ marginRight: '5px' }}>Capture</button>
                  )}
                  {p.status === 'success' && (
                    <button className="action-btn" onClick={() => { setSelectedPayment(p.id); setShowRefundModal(true); }}>Refund</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Styled Refund Modal */}
      {showRefundModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Process Refund</h3>
            <form onSubmit={handleRefund}>
              <input
                type="number"
                placeholder="Amount (in paise)"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                required
                className="input-field"
              />
              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => setShowRefundModal(false)}>Cancel</button>
                <button type="submit" className="action-btn primary">Confirm Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
