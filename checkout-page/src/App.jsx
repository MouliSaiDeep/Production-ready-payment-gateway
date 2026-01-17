import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CheckoutIframe from "./pages/CheckoutIframe";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. The actual page */}
        <Route path="/checkout" element={<CheckoutIframe />} />

        <Route path="*" element={<Navigate to="/checkout" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
