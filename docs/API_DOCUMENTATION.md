# 📚 Payment Gateway API Reference

**Base URL:** `http://localhost:8000`  
**Version:** v1

---

## 🔐 Authentication

Most endpoints require API Key authentication via HTTP Headers.

- **`x-api-key`**: Your public API Key (e.g., `key_test_abc123`)
- **`x-api-secret`**: Your private API Secret (e.g., `secret_test_xyz789`)

---

## 📡 System Endpoints

### 1. Health Check

Checks if the API and Database are running. Used by load balancers and automated evaluators.

- **Endpoint:** `GET /health`
- **Authentication:** None
- **Response:** `200 OK`
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
  ```

### 2. Verify Test Merchant

Confirms that the database was seeded correctly on startup.

- **Endpoint:** `GET /api/v1/test/merchant`
- **Authentication:** None
- **Response:** `200 OK`
  ```json
  {
    "id": "merchant_123",
    "email": "test@example.com",
    "api_key": "key_test_abc123",
    "seeded": true
  }
  ```

---

## 📦 Order Endpoints

### 3. Create Order

Creates a new payment intent.

- **Endpoint:** `POST /api/v1/orders`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "amount": 50000, // Amount in smallest unit (e.g., paise). Min: 100
    "currency": "INR", // Default: INR
    "receipt": "rcpt_123", // Optional
    "notes": {
      // Optional metadata
      "customer_name": "John Doe"
    }
  }
  ```
- **Success Response:** `201 Created`
  ```json
  {
    "id": "order_NXhj67fGH2jk9mPq",
    "merchant_id": "merchant_123",
    "amount": 50000,
    "currency": "INR",
    "status": "created",
    "created_at": "2024-01-15T10:30:00Z"
  }
  ```
- **Error Response:** `400 Bad Request`
  ```json
  {
    "error": {
      "code": "BAD_REQUEST_ERROR",
      "description": "amount must be at least 100"
    }
  }
  ```

### 4. Get Order Details

Fetches the status and details of a specific order.

- **Endpoint:** `GET /api/v1/orders/:order_id`
- **Authentication:** Required
- **Success Response:** `200 OK`
  ```json
  {
    "id": "order_NXhj67fGH2jk9mPq",
    "amount": 50000,
    "status": "created",
    "currency": "INR"
  }
  ```

---

## 💳 Payment Endpoints

### 5. Create Payment (Process Transaction)

Initiates a payment for an order.

- **Endpoint:** `POST /api/v1/payments`
- **Authentication:** Required
- **Request Body (Card):**
  ```json
  {
    "order_id": "order_NXhj67fGH2jk9mPq",
    "method": "card",
    "card": {
      "number": "4242424242424242", // Luhn Validated
      "expiry_month": "12",
      "expiry_year": "2030",
      "cvv": "123",
      "holder_name": "John Doe"
    }
  }
  ```
- **Request Body (UPI):**
  ```json
  {
    "order_id": "order_NXhj67fGH2jk9mPq",
    "method": "upi",
    "vpa": "user@bank"
  }
  ```
- **Success Response:** `201 Created`
  ```json
  {
    "id": "pay_H8sK3jD9s2L1pQr",
    "order_id": "order_NXhj67fGH2jk9mPq",
    "status": "processing", // Always starts as 'processing'
    "method": "card",
    "card_network": "visa",
    "card_last4": "4242"
  }
  ```

### 6. Get Payment Details

Checks the final status of a payment (Success/Failed).

- **Endpoint:** `GET /api/v1/payments/:payment_id`
- **Authentication:** Required
- **Success Response:** `200 OK`
  ```json
  {
    "id": "pay_H8sK3jD9s2L1pQr",
    "status": "success",
    "amount": 50000,
    "method": "card"
  }
  ```

---

## ⚠️ Error Codes

The API returns standardized error codes to help with debugging and integration.

| Error Code             | HTTP Status | Description                                               |
| :--------------------- | :---------- | :-------------------------------------------------------- |
| `AUTHENTICATION_ERROR` | 401         | Missing or invalid API Keys.                              |
| `BAD_REQUEST_ERROR`    | 400         | Validation failed (e.g., invalid amount, missing fields). |
| `NOT_FOUND_ERROR`      | 404         | Order or Payment ID does not exist.                       |
| `INVALID_VPA`          | 400         | UPI ID format is incorrect.                               |
| `INVALID_CARD`         | 400         | Card number failed Luhn check.                            |
| `EXPIRED_CARD`         | 400         | Card expiry date is in the past.                          |
| `INTERNAL_ERROR`       | 500         | Server-side processing error.                             |

---

## 🌐 Public Wrappers (Frontend Support)

_These endpoints allow the Checkout Page to function without exposing API Secrets._

- **`GET /api/v1/orders/:id/public`**: Fetches order details without auth headers.
- **`POST /api/v1/payments/public`**: Processes payment without auth headers (Backend validates Order ID ownership internally).
- **`GET /api/v1/payments/:id/public`**: Fetches limited payment status without auth headers.

---

## ↩️ Refund & Capture Endpoints

### 7. Capture Payment

Captures an authorized payment (if separate auth/capture flow is used, though currently auto-capture is standard).

- **Endpoint:** `POST /api/v1/payments/:payment_id/capture`
- **Authentication:** Required
- **Success Response:** `200 OK`

### 8. Create Refund

Initiates a refund for a successful payment.

- **Endpoint:** `POST /api/v1/payments/:payment_id/refunds`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "amount": 500, // Amount to refund in paise
    "reason": "Customer requested"
  }
  ```
- **Success Response:** `201 Created`
  ```json
  {
    "id": "rfnd_abc123",
    "payment_id": "pay_xyz789",
    "amount": 500,
    "status": "pending"
  }
  ```

### 9. Get Refund Details

- **Endpoint:** `GET /api/v1/refunds/:refund_id`
- **Authentication:** Required
- **Success Response:** `200 OK`

---

## 🔔 Webhook Endpoints

### 10. List Webhook Logs

Fetches recent webhook delivery attempts.

- **Endpoint:** `GET /api/v1/webhooks`
- **Authentication:** Required
- **Success Response:** `200 OK` (Array of logs)

### 11. Retry Webhook

Manually retries a failed webhook delivery.

- **Endpoint:** `POST /api/v1/webhooks/:webhook_id/retry`
- **Authentication:** Required
- **Success Response:** `200 OK`

---

## ⚙️ Merchant Configuration

### 12. Get Merchant Config

- **Endpoint:** `GET /api/v1/merchant`
- **Authentication:** Required
- **Success Response:** `200 OK`
  ```json
  {
      "id": "...",
      "webhook_url": "http://...",
      "webhook_secret": "whsec_..."
  }
  ```

### 13. Update Merchant Config

- **Endpoint:** `PUT /api/v1/merchant`
- **Authentication:** Required
- **Request Body:** `{ "webhook_url": "http://..." }`
- **Success Response:** `200 OK`

### 14. Regenerate Webhook Secret

Rotates the webhook signing secret.

- **Endpoint:** `POST /api/v1/merchant/secret/regenerate`
- **Authentication:** Required
- **Success Response:** `200 OK`
