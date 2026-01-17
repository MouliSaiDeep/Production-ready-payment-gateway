import React from "react";

export default function ApiDocs() {
  return (
    <div data-test-id="api-docs">
      <h2>Integration Guide</h2>

      <section
        data-test-id="section-create-order"
        className="checkout-card"
        style={{ marginBottom: "1.5rem" }}
      >
        <h3>1. Create Order</h3>
        <p className="label">
          Call this endpoint from your backend to create an order.
        </p>
        <pre data-test-id="code-snippet-create-order" style={codeBlockStyle}>
          {`curl -X POST http://localhost:8000/api/v1/orders \\
  -H "X-Api-Key: key_test_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "INR",
    "receipt": "receipt_123"
  }'`}
        </pre>
      </section>

      <section
        data-test-id="section-sdk-integration"
        className="checkout-card"
        style={{ marginBottom: "1.5rem" }}
      >
        <h3>2. SDK Integration</h3>
        <p className="label">Add this script to your checkout page.</p>
        <pre data-test-id="code-snippet-sdk" style={codeBlockStyle}>
          {`<script src="http://localhost:3001/checkout.js"></script>
<script>
const checkout = new PaymentGateway({
  key: 'key_test_abc123',
  orderId: 'order_xyz',
  onSuccess: (response) => {
    console.log('Payment ID:', response.paymentId);
  },
  onFailure: (error) => {
    console.error('Payment failed:', error);
  }
});

document.getElementById('pay-btn').onclick = () => checkout.open();
</script>`}
        </pre>
      </section>

      <section
        data-test-id="section-webhook-verification"
        className="checkout-card"
      >
        <h3>3. Verify Webhook Signature</h3>
        <p className="label">
          Secure your webhooks by verifying the HMAC signature.
        </p>
        <pre data-test-id="code-snippet-webhook" style={codeBlockStyle}>
          {`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}`}
        </pre>
      </section>
    </div>
  );
}

const codeBlockStyle = {
  background: "#1f2937",
  color: "#e5e7eb",
  padding: "1rem",
  borderRadius: "8px",
  overflowX: "auto",
  fontFamily: "monospace",
  fontSize: "0.875rem",
  lineHeight: "1.5",
};
