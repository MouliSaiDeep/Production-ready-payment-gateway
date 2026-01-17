import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("test@example.com"); // Default for convenience
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Fetch the Test Merchant data directly (Since /auth/login is missing)
      const response = await fetch(
        "http://localhost:8000/api/v1/test/merchant",
      );

      if (!response.ok) {
        throw new Error("Could not connect to backend");
      }

      const merchant = await response.json();

      // 2. Simple validation
      if (email !== merchant.email) {
        setError("Invalid email. Please use: " + merchant.email);
        setLoading(false);
        return;
      }

      // 3. Save Session Data
      // We create a "dummy" token because your backend uses API Keys, not JWTs
      localStorage.setItem("authToken", "session_token_123");
      localStorage.setItem("user", JSON.stringify({ email: merchant.email }));
      localStorage.setItem("merchant", JSON.stringify(merchant)); // Crucial for Dashboard

      // 4. Update State & Redirect
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      setError("Login failed. Ensure Backend is running on Port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">💳</span>
          <h1>Payment Gateway</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Any password works"
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Test Account: <b>test@example.com</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
