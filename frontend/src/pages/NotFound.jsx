import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", marginTop: "5rem", color: "#374151" }}>
      <h1>404</h1>
      <p>Page not found</p>
      <Link
        to="/dashboard"
        style={{ color: "#2563eb", textDecoration: "none" }}
      >
        &larr; Back to Dashboard
      </Link>
    </div>
  );
}
