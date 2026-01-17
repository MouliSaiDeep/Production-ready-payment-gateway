import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="brand">Gateway UI</div>
        <Link to="/dashboard" className="nav-link">
          Overview
        </Link>
        <Link to="/dashboard/transactions" className="nav-link active">
          Transactions
        </Link>
      </div>

      <div className="main-content">
        <h1>Transactions</h1>

        <div className="table-container">
          {/* Exact ID: transactions-table */}
          <table data-test-id="transactions-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                // Exact Row Attributes
                <tr
                  key={p.id}
                  data-test-id="transaction-row"
                  data-payment-id={p.id}
                >
                  <td data-test-id="payment-id">{p.id}</td>
                  <td data-test-id="order-id">{p.order_id}</td>
                  {/* Amount is just the number as per spec example */}
                  <td data-test-id="amount">{p.amount}</td>
                  <td data-test-id="method">{p.method}</td>
                  <td data-test-id="status">{p.status}</td>
                  <td data-test-id="created-at">
                    {new Date(p.created_at).toISOString().split("T")[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
