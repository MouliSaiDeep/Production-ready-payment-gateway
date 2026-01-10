import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email === "test@example.com") {
      try {
        const res = await axios.get(
          "http://localhost:8000/api/v1/test/merchant"
        );
        localStorage.setItem("merchant", JSON.stringify(res.data));
        navigate("/dashboard");
      } catch (err) {
        alert("Could not fetch test merchant details. Check backend.");
      }
    } else {
      alert("Invalid. Use test@example.com");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 style={{ marginTop: 0, textAlign: "center" }}>Merchant Portal</h2>
        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "2rem",
          }}
        >
          Sign in to manage your payments
        </p>

        <form data-test-id="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>
              Email Address
            </label>
            <input
              data-test-id="email-input"
              className="form-input"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label style={{ fontSize: "0.875rem", fontWeight: "500" }}>
              Password
            </label>
            <input
              data-test-id="password-input"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            data-test-id="login-button"
            type="submit"
            className="btn-primary"
          >
            Sign In
          </button>
        </form>
        <div
          style={{
            marginTop: "1rem",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          Test Credentials: test@example.com
        </div>
      </div>
    </div>
  );
}
