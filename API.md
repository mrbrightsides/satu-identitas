# API.md — SatuIdentitas REST API Reference

Base URL (local): `http://localhost:5000`

All request and response bodies use `Content-Type: application/json`.

---

## Table of Contents

- [Identity (Citizen)](#identity-citizen)
- [Visa / Visitor Identity](#visa--visitor-identity)
- [Verification](#verification)
- [Fraud Detection](#fraud-detection)
- [Overstay Monitor](#overstay-monitor)
- [AI Chatbot](#ai-chatbot)
- [Data Types](#data-types)

---

## Identity (Citizen)

### Register a Citizen DID

```
POST /api/identities
```

Creates a new DID for an Indonesian citizen (NIK or KK). Automatically uploads a W3C Verifiable Credential to IPFS via Pinata.

**Request body:**

```json
{
  "idType": "NIK",
  "idNumber": "3201234567890001",
  "fullName": "Budi Santoso"
}
```

| Field | Type | Rules |
|---|---|---|
| `idType` | `"NIK"` \| `"KK"` | Required |
| `idNumber` | string | Required, exactly 16 digits |
| `fullName` | string | Required, min 3 characters |

**Response `201`:**

```json
{
  "id": 1,
  "idType": "NIK",
  "idNumber": "3201234567890001",
  "fullName": "Budi Santoso",
  "did": "did:elpeef:citizen:6403acf84d9ae77a3de1cf44dd43a572...",
  "txHash": null,
  "ipfsHash": "QmXyz...",
  "status": "pending",
  "createdAt": "2026-03-19T00:00:00.000Z"
}
```

**Error `409`** — duplicate NIK/KK:
```json
{ "message": "Identity with this ID number already exists" }
```

---

### List All Citizen DIDs

```
GET /api/identities
```

Returns all registered citizen identities, newest first.

**Response `200`:** Array of Identity objects.

---

### Get Identity by DID (Unified)

```
GET /api/did/:did
```

Looks up a DID across both citizen and visitor tables. Accepts both raw and URL-encoded DID strings.

**Example:**
```
GET /api/did/did%3Aelpeef%3Acitizen%3A6403acf8...
```

**Response `200`:**

```json
{
  "id": 1,
  "did": "did:elpeef:citizen:6403acf84d9ae77a3de1cf44dd43a572...",
  "fullName": "Budi Santoso",
  "status": "registered",
  "txHash": "0xabc123...",
  "ipfsHash": "QmXyz...",
  "identityType": "citizen"
}
```

**Error `404`:**
```json
{ "message": "Identity not found" }
```

---

### Update Transaction Hash (Citizen)

```
PATCH /api/did/:did/tx
```

Called by the frontend after a successful MetaMask on-chain registration to save the Sepolia transaction hash. Also sets `status` to `"registered"`.

**Request body:**

```json
{ "txHash": "0xabc123def456..." }
```

**Response `200`:** Updated Identity object.

**Error `400`:**
```json
{ "message": "txHash required" }
```

---

### Generate Offline JWT Credential

```
GET /api/did/:did/offline-jwt
```

Returns an HMAC-SHA256 signed JWT for offline QR verification. Does not require MetaMask or internet at verification time.

- Citizens: valid **1 year**
- Visitors: valid **30 days**

**Response `200`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2027-03-19T00:00:00.000Z"
}
```

**JWT payload structure:**

```json
{
  "did": "did:elpeef:citizen:6403...",
  "fullName": "Budi Santoso",
  "idType": "NIK",
  "identityType": "citizen",
  "status": "registered",
  "txHash": "0xabc123...",
  "issuer": "did:elpeef:authority:imigrasi-ri",
  "iat": 1742196000,
  "exp": 1773732000
}
```

---

## Visa / Visitor Identity

### Register a Visitor DID

```
POST /api/visa-identities
```

Creates a temporary DID for a tourist, work, or business visa holder. Uploads a W3C VisaCredential to IPFS.

**Request body:**

```json
{
  "visaType": "tourist",
  "passportNumber": "A12345678",
  "fullName": "John Smith",
  "nationality": "United Kingdom",
  "visaExpiry": "2026-09-19T00:00:00.000Z",
  "kycUrl": "https://kyc.example.com/john-smith",
  "auditUrl": "https://audit.example.com/john-smith"
}
```

| Field | Type | Rules |
|---|---|---|
| `visaType` | `"tourist"` \| `"work"` \| `"business"` | Required |
| `passportNumber` | string | Required, 6–20 characters |
| `fullName` | string | Required, min 3 characters |
| `nationality` | string | Optional |
| `visaExpiry` | ISO 8601 date string | Required, must be in the future |
| `kycUrl` | string (URL) | Required |
| `auditUrl` | string (URL) | Optional |

**Response `201`:** VisaIdentity object.

**Error `409`** — duplicate passport:
```json
{ "message": "Visitor with this passport number already registered" }
```

---

### Get Visitor Identity by DID

```
GET /api/visa-identities/:did
```

**Response `200`:** VisaIdentity object including `visaExpiry`, `flaggedAt`, and `status`.

---

### List Flagged (Overstay) Visitors

```
GET /api/visa-identities/flagged
```

Returns all visitor identities with `status: "flagged"` (detected as overstaying).

**Response `200`:** Array of VisaIdentity objects.

---

### Update Visitor Transaction Hash

```
PATCH /api/visa-identities/:did/tx
```

**Request body:**
```json
{ "txHash": "0xabc123..." }
```

**Response `200`:** Updated VisaIdentity object.

---

## Verification

### Verify an Offline JWT

```
POST /api/verify-jwt
```

Verifies an HMAC-SHA256 signed JWT credential (generated by `/api/did/:did/offline-jwt`). Does not require the DID to exist in the database — purely cryptographic verification.

**Request body:**

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Response `200` — valid:**

```json
{
  "valid": true,
  "payload": {
    "did": "did:elpeef:citizen:6403...",
    "fullName": "Budi Santoso",
    "status": "registered",
    "exp": 1773732000
  }
}
```

**Response `200` — invalid:**

```json
{
  "valid": false,
  "message": "Invalid signature — token may have been tampered"
}
```

**Response `200` — expired:**

```json
{
  "valid": false,
  "message": "Token has expired"
}
```

---

### Batch Verify Multiple DIDs

```
POST /api/verifications/batch
```

Verify up to hundreds of DIDs in a single API call. Useful for banks, hospitals, and government services.

**Request body:**

```json
{
  "dids": [
    "did:elpeef:citizen:6403acf8...",
    "did:elpeef:visitor:9388be71..."
  ],
  "verifierName": "BCA Bank",
  "reason": "KYC — Account Opening"
}
```

| Field | Type | Description |
|---|---|---|
| `dids` | string[] | Array of DID strings to verify |
| `verifierName` | string | Name of the verifying institution |
| `reason` | string | Reason for verification (logged) |

**Response `200`:**

```json
{
  "results": [
    {
      "did": "did:elpeef:citizen:6403acf8...",
      "found": true,
      "status": "registered",
      "txHash": "0xabc123...",
      "fraudFlags": []
    },
    {
      "did": "did:elpeef:visitor:9388be71...",
      "found": false
    }
  ],
  "totalChecked": 2,
  "validDIDs": 1,
  "fraudDetected": 0
}
```

---

### Get Verification History for a DID

```
GET /api/verifications/:did/history
```

Returns all past verifications for a DID, ordered by most recent first.

**Response `200`:** Array of Verification objects:

```json
[
  {
    "id": 1,
    "did": "did:elpeef:citizen:6403...",
    "verifiedAt": "2026-03-19T10:00:00.000Z",
    "verifierName": "BCA Bank",
    "verificationReason": "KYC — Account Opening",
    "result": "verified"
  }
]
```

---

## Fraud Detection

### Check Fraud Flags for a DID

```
GET /api/fraud/:did
```

Returns all fraud flags associated with a DID and a computed risk level.

**Response `200`:**

```json
{
  "did": "did:elpeef:citizen:6403...",
  "hasFraudFlags": false,
  "flags": [],
  "riskLevel": "low",
  "relatedIdentities": []
}
```

**Risk levels:** `"low"` | `"medium"` | `"high"` | `"critical"`

---

### Submit a Fraud Report

```
POST /api/fraud/report
```

Manually report a DID for suspicious activity.

**Request body:**

```json
{
  "did": "did:elpeef:citizen:6403...",
  "flagType": "manual_report",
  "description": "Suspected use of forged NIK document",
  "severity": "high",
  "relatedDIDs": ["did:elpeef:citizen:abc123..."]
}
```

| Field | Type | Options |
|---|---|---|
| `flagType` | string | `"duplicate_nik"`, `"duplicate_name"`, `"suspicious_pattern"`, `"manual_report"` |
| `severity` | string | `"low"`, `"medium"`, `"high"`, `"critical"` |
| `relatedDIDs` | string[] | Optional array of related DID strings |

**Response `201`:** Created FraudFlag object.

---

## Overstay Monitor

### List All Overstay Events

```
GET /api/overstay-events
```

Returns all overstay detection events, newest first.

**Response `200`:**

```json
[
  {
    "id": 1,
    "event": "OVERSTAY_DETECTED",
    "did": "did:elpeef:visitor:9388...",
    "timestamp": "2026-03-17T06:46:31.697Z",
    "status": "flagged",
    "metadata": {
      "fullName": "John Smith",
      "nationality": "United Kingdom",
      "passportNumber": "A12345678",
      "visaType": "tourist",
      "visaExpiry": "2026-03-14T00:00:00.000Z",
      "overstayDuration": "3d 2h 15m",
      "detectedAt": "2026-03-17T06:46:31.691Z"
    }
  }
]
```

---

### Get Overstay Events for a Specific DID

```
GET /api/overstay-events/:did
```

**Response `200`:** Array of overstay events for the given DID.

---

### Manually Trigger Overstay Check

```
POST /api/overstay-events/trigger
```

Manually runs the overstay detection cycle immediately (useful for demos and testing without waiting for the 30-second interval).

**Request body:** Empty `{}`

**Response `200`:**

```json
{
  "message": "Overstay check triggered",
  "flagged": 2
}
```

---

## AI Chatbot

### Send a Chat Message to SatuBot

```
POST /api/chat
```

Sends a message to the SatuBot AI assistant (powered by Google Gemini 2.0 Flash). Supports multi-turn conversation by passing previous messages in the `messages` array.

**Request body:**

```json
{
  "message": "Bagaimana cara mendaftar DID?",
  "messages": [
    { "role": "user", "content": "Apa itu SatuIdentitas?" },
    { "role": "model", "content": "SatuIdentitas adalah platform identitas terdesentralisasi untuk Indonesia." }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `message` | string | The user's current message |
| `messages` | array | Previous conversation history (optional) |

**Response `200`:**

```json
{
  "reply": "Untuk mendaftar DID, kunjungi halaman /register dan hubungkan dompet MetaMask Anda..."
}
```

SatuBot responds in the same language as the user's message (Bahasa Indonesia or English).

---

## Data Types

### Identity Object

```typescript
{
  id: number
  idType: "NIK" | "KK"
  idNumber: string           // 16-digit NIK or KK number
  fullName: string
  did: string                // did:elpeef:citizen:<hex>
  txHash: string | null      // Sepolia transaction hash
  ipfsHash: string | null    // Pinata IPFS CID
  status: "pending" | "registered"
  createdAt: string          // ISO 8601
}
```

### VisaIdentity Object

```typescript
{
  id: number
  visaType: "tourist" | "work" | "business"
  passportNumber: string
  fullName: string
  nationality: string | null
  visaExpiry: string         // ISO 8601
  did: string                // did:elpeef:visitor:<hex>
  kycUrl: string | null
  auditUrl: string | null
  txHash: string | null
  ipfsHash: string | null
  status: "pending" | "registered" | "flagged"
  flaggedAt: string | null   // ISO 8601, set when overstay detected
  createdAt: string          // ISO 8601
}
```

### FraudFlag Object

```typescript
{
  id: number
  did: string
  flagType: "duplicate_nik" | "duplicate_name" | "suspicious_pattern" | "manual_report"
  description: string | null
  severity: "low" | "medium" | "high" | "critical"
  resolved: boolean
  relatedDIDs: string[]
  flaggedAt: string          // ISO 8601
  resolvedAt: string | null  // ISO 8601
}
```

### Verification Object

```typescript
{
  id: number
  did: string
  verifiedAt: string         // ISO 8601
  verifierName: string | null
  verificationReason: string | null
  result: "verified" | "rejected" | "pending"
  metadata: object | null
}
```
