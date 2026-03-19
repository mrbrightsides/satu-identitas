# SatuIdentitas 🇮🇩

**Decentralized Identity (DID) Platform for Indonesia**

SatuIdentitas is a full-stack Web3 application that replaces physical KTP/NIK identity documents with blockchain-anchored Decentralized Identifiers (DIDs).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Smart Contract](#smart-contract)
- [DID Format](#did-format)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Pages & Navigation](#pages--navigation)
- [Overstay Detection System](#overstay-detection-system)
- [Offline QR Verification](#offline-qr-verification)
- [Soulbound Token (SBT)](#soulbound-token-sbt)
- [IPFS Certificate Storage](#ipfs-certificate-storage)
- [Database Schema](#database-schema)

---

## Overview

SatuIdentitas digitizes Indonesia's national identity system using W3C-compliant DIDs anchored to the Ethereum Sepolia testnet. Citizens register their NIK/KK and receive a permanent on-chain identity. Visa holders (tourists, workers, business travelers) get temporary DIDs with built-in expiry enforcement.

The system supports:
- On-chain DID registration via MetaMask
- IPFS-stored verifiable credentials
- QR code generation (blockchain + offline JWT modes)
- Batch identity verification for enterprises
- Automated fraud detection
- Real-time overstay detection for immigration compliance
- Soulbound Token (SBT) visual identity cards

---

## Features

### 🪪 Citizen DID Registration
- Connect MetaMask wallet → submit NIK/KK details
- SHA-256 hash of ID stored on-chain (privacy-preserving)
- IPFS certificate with W3C Verifiable Credential structure including `proof.algorithm: SHA-256`
- Sepolia transaction anchored; DID status updates to `registered`

### 🌏 Visitor / Visa DID
- Temporary DID for tourists, work visa, and business visa holders
- Includes passport number, nationality, visa type, and expiry date
- W3C VC-style IPFS certificate with `EcdsaSecp256k1Signature` proof
- Auto-expiry enforcement via the Overstay Monitor

### 🔗 Blockchain Anchoring
- Smart contract `DIDRegistry.sol` deployed on **Sepolia** at `0xc0B12ACf49BA12655ae561f102FF8d22D2d9902C`
- MetaMask + ethers.js v6 integration
- Auto-recovery: if DID is on-chain but DB shows `pending`, system scans `DIDRegistered` event logs and recovers `txHash` automatically

### 📦 IPFS Certificate Storage
- DID certificates uploaded to **Pinata** IPFS
- Citizen cert includes: `subject`, `idHash`, `issuer`, `status`, `proof`
- Visitor cert includes: `subject`, `visa`, `entry`, `issuer`, `status`, `proof`
- Accessible via `https://gateway.pinata.cloud/ipfs/<hash>`

### 📱 QR Code Generation
Two modes on every DID detail page:

**Blockchain Mode** — links to Sepolia Etherscan transaction

**Offline JWT Mode** — HMAC-SHA256 signed token:
- Citizens: valid **1 year**
- Visa holders: valid **30 days**
- Verifiable without internet connection

### ✅ Batch Identity Verification API
- POST `/api/verifications/batch` — verify up to hundreds of DIDs in one call
- Returns: found/not found, status, txHash, fraud flags per DID
- Response includes totals: `totalChecked`, `validDIDs`, `fraudDetected`

### 🚨 Fraud Detection
- Duplicate NIK/KK detection on every registration
- Suspicious pattern detection (abnormal registrations per region code)
- Manual fraud reporting by verifiers
- Risk levels: `low`, `medium`, `high`, `critical`

### 🛂 Overstay Detection (Real-Time)
- Background monitor runs every **30 seconds**
- Detects visas where `current_time > visa_expiry`
- Triggers `OVERSTAY_DETECTED` event, updates status to `flagged`
- JSON event format:
```json
{
  "event": "OVERSTAY_DETECTED",
  "did": "did:elpeef:visitor:9388...",
  "timestamp": "2026-03-17T06:46:31.697Z",
  "status": "flagged"
}
```

### 🤖 AI Chatbot (SatuBot)
- Floating chatbot widget available on every page (bottom-right corner)
- Powered by Google Gemini 2.0 Flash
- Context-aware: knows all platform features, DID formats, pages, and flows
- Supports conversation history (multi-turn dialogue)
- Responds in Bahasa Indonesia or English depending on user input
- Quick suggestion prompts for new users
- Endpoint: `POST /api/chat`

### 🎖️ Soulbound Token (SBT)
- Non-transferable identity card displayed when DID is anchored on-chain
- Token ID derived deterministically from DID hex (7-digit format)
- "Non-transferable · Sepolia" badge, dark metallic visual design
- Reference implementation: `script/DIDSoulboundToken.sol` (ERC-5114)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React + Vite)                 │
│  Pages: Home, Register, VisaRegister, Verify, VerifyQR  │
│         Dashboard, IdentityDetail, OverstayMonitor       │
│  State: TanStack Query v5  │  Routing: Wouter            │
│  Wallet: MetaMask + ethers.js v6                         │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (same port)
┌───────────────────────▼─────────────────────────────────┐
│               Server (Express + TypeScript)              │
│  routes.ts — REST API endpoints                          │
│  storage.ts — DatabaseStorage (Drizzle ORM)              │
│  ipfs.ts — Pinata upload helpers                         │
│  overstay-monitor.ts — setInterval background job        │
└───────────┬──────────────────────────┬──────────────────┘
            │                          │
┌───────────▼──────────┐   ┌──────────▼──────────────────┐
│   PostgreSQL (Replit) │   │  External Services           │
│   Tables:             │   │  • Sepolia (Infura RPC)      │
│   - identities        │   │  • Pinata IPFS               │
│   - visa_identities   │   │  • Etherscan (tx links)      │
│   - verifications     │   └─────────────────────────────┘
│   - fraud_flags       │
│   - overstay_events   │
└──────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI Components | shadcn/ui (Radix UI), Tailwind CSS |
| State Management | TanStack Query v5 |
| Routing | Wouter |
| Animations | Framer Motion |
| Backend | Express 5, TypeScript, tsx |
| Database | PostgreSQL (Drizzle ORM + drizzle-zod) |
| Blockchain | ethers.js v6, MetaMask, Sepolia testnet |
| IPFS | Pinata |
| Auth/Signing | HMAC-SHA256 (JWT), Session secret |
| QR Codes | qrcode.react |

---

## Smart Contract

**File:** `DIDRegistry.sol`

**Deployed on Sepolia:** `0xc0B12ACf49BA12655ae561f102FF8d22D2d9902C`

**RPC:** `https://sepolia.infura.io/v3/<INFURA_KEY>`

```solidity
function registerDID(string memory _did, string memory _idHash) public
function getIdentity(string memory _did) public view returns (string, string, uint256, address)
event DIDRegistered(string did, string idHash, address indexed owner)
```

Key behaviors:
- `registerDID` reverts with `"DID already registered"` if DID exists
- `getIdentity` reverts with `"DID not found"` for unregistered DIDs (does NOT return empty struct)
- `idHash` stores `SHA-256(NIK)` — raw ID never touches the chain

**Soulbound Token Contract Reference:** `script/DIDSoulboundToken.sol` (ERC-5114, non-transferable ERC-721)

---

## Security & Privacy Design

### 🔒 Privacy-Preserving Identity (Zero-Knowledge Principle)

The actual NIK (National ID number) is **never published to the blockchain**. Instead, the system computes a SHA-256 hash of the NIK on the client side and sends only that hash (`idHash`) to the smart contract:

```
idHash = SHA-256(NIK)  →  stored on-chain
NIK                    →  never leaves the user's device
```

This means even if someone reads every transaction on the Sepolia blockchain, they cannot recover the original NIK from the hash — protecting citizens from identity scraping and data harvesting on a public ledger.

The same principle applies to visitors: `SHA-256(passportNumber)` is used, not the raw passport number.

### 🔐 Tamper-Proof Registration (Immutability)

Once a DID is registered, the `"Registered"` status is **permanently recorded on the Sepolia blockchain** and cannot be altered — not by the platform, not by a database administrator, not by anyone. The smart contract enforces this with an on-chain revert:

```solidity
require(!identities[_did].exists, "DID already registered");
```

Any verifier — a bank, employer, or government agency — can independently confirm a DID's status by querying the contract directly on [Etherscan](https://sepolia.etherscan.io) without relying on SatuIdentitas infrastructure at all. The database (`tx_hash` column) serves only as a convenience index; the ground truth always lives on-chain.

---

## DID Format

```
Citizen:  did:elpeef:citizen:<sha256_hex_of_NIK>
Visitor:  did:elpeef:visitor:<sha256_hex_of_passport>
```

Examples:
```
did:elpeef:citizen:6403acf84d9ae77a3de1cf44dd43a572...
did:elpeef:visitor:9388be71f20a4c1e3d5ab2f8c0e6a1d9...
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- MetaMask browser extension (for on-chain features)
- Pinata account (for IPFS)
- Infura account (for Sepolia RPC)

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app runs on `http://localhost:5000` serving both the API and the frontend.

### Build for Production

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for HMAC-SHA256 JWT signing |
| `PINATA_JWT` | Pinata API JWT for IPFS uploads |
| `VITE_INFURA_KEY` | Infura project key for Sepolia RPC (frontend) |
| `VITE_CONTRACT_ADDRESS` | DIDRegistry contract address (frontend) |

---

## API Reference

### Identity

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/identities` | Register a new citizen DID |
| `GET` | `/api/identities` | List all citizen DIDs |
| `GET` | `/api/did/:did` | Get DID (citizen or visitor, unified) |
| `PATCH` | `/api/did/:did/tx` | Update txHash after on-chain registration |
| `GET` | `/api/did/:did/offline-jwt` | Generate offline JWT credential |

### Visa / Visitor DID

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/visa-identities` | Register a visitor DID |
| `GET` | `/api/visa-identities/:did` | Get visitor identity by DID |
| `GET` | `/api/visa-identities/flagged` | List all flagged (overstay) visitors |
| `PATCH` | `/api/visa-identities/:did/tx` | Update visitor txHash |

### Verification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/verify-jwt` | Verify an offline JWT credential |
| `POST` | `/api/verifications/batch` | Batch verify multiple DIDs |
| `GET` | `/api/verifications/:did/history` | Get verification history for a DID |

### Fraud Detection

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/fraud/:did` | Check fraud flags for a DID |
| `POST` | `/api/fraud/report` | Submit a manual fraud report |

### Overstay Monitor

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/overstay-events` | List all overstay events (newest first) |
| `GET` | `/api/overstay-events/:did` | Overstay events for a specific DID |
| `POST` | `/api/overstay-events/trigger` | Manually trigger overstay check (demo) |

### Batch Verification Request Body

```json
{
  "dids": ["did:elpeef:citizen:abc...", "did:elpeef:visitor:def..."],
  "verifierName": "BCA Bank",
  "reason": "KYC — Account Opening"
}
```

### Batch Verification Response

```json
{
  "results": [
    {
      "did": "did:elpeef:citizen:abc...",
      "found": true,
      "status": "registered",
      "txHash": "0x...",
      "fraudFlags": []
    }
  ],
  "totalChecked": 2,
  "validDIDs": 1,
  "fraudDetected": 0
}
```

---

## Pages & Navigation

| Path | Page | Description |
|---|---|---|
| `/` | Home | Landing page with feature overview |
| `/register` | Create DID | Citizen NIK/KK registration form |
| `/visa-register` | Visa DID | Visitor temporary DID registration |
| `/verify` | Verify Identity | Look up any DID |
| `/verify-qr` | Verify QR | Paste & verify offline JWT credential |
| `/overstay-monitor` | Overstay Monitor | Real-time immigration compliance dashboard |
| `/dashboard` | Dashboard | Overview of all registered identities |
| `/did/:did` | Identity Detail | Full DID profile, QR, SBT card |

---

## Overstay Detection System

The overstay detection system enforces visa compliance automatically without any manual intervention.

### How It Works

```
User enters Indonesia
        │
        ▼
Visitor DID registered (visaExpiry set)
        │
        ▼
Background monitor runs every 30 seconds
        │
        ▼
Check: current_time > visa_expiry AND status != 'flagged'
        │
     YES│
        ▼
┌───────────────────────┐
│ 1. Flag visa_identity  │  status → 'flagged', flaggedAt → now()
│ 2. Write overstay_event│  event → 'OVERSTAY_DETECTED'
│ 3. Log to console      │  JSON format
└───────────────────────┘
```

### Event JSON

```json
{
  "event": "OVERSTAY_DETECTED",
  "did": "did:elpeef:visitor:9388...",
  "timestamp": "2026-03-17T06:46:31.697Z",
  "status": "flagged"
}
```

### Event Metadata (stored in DB)

```json
{
  "fullName": "Ahmad Fikri Santoso",
  "nationality": "Malaysia",
  "passportNumber": "XD999TEST1",
  "visaType": "tourist",
  "visaExpiry": "2026-03-14T04:31:23.285Z",
  "overstayDuration": "3d 2h 15m",
  "detectedAt": "2026-03-17T06:46:31.691Z"
}
```

### Manual Trigger (Demo)

```bash
curl -X POST http://localhost:5000/api/overstay-events/trigger
```

---

## Offline QR Verification

Designed for **offline use** — no internet required once the QR is generated.

### Generation

- Endpoint: `GET /api/did/:did/offline-jwt`
- Algorithm: HMAC-SHA256 using `SESSION_SECRET`
- Format: `base64url(header).base64url(payload).base64url(signature)`
- Citizens: **1 year** validity
- Visitors: **30 days** validity

### JWT Payload

```json
{
  "did": "did:elpeef:citizen:6403...",
  "fullName": "John Doe",
  "idType": "NIK",
  "identityType": "citizen",
  "status": "registered",
  "txHash": "0x...",
  "issuer": "did:elpeef:authority:imigrasi-ri",
  "iat": 1742196000,
  "exp": 1773732000
}
```

### Verification

```bash
curl -X POST http://localhost:5000/api/verify-jwt \
  -H "Content-Type: application/json" \
  -d '{"token": "<jwt>"}'
```

Response:
```json
{
  "valid": true,
  "payload": { "fullName": "John Doe", "status": "registered", ... }
}
```

Tampered tokens are rejected:
```json
{
  "valid": false,
  "message": "Invalid signature — token may have been tampered"
}
```

---

## Soulbound Token (SBT)

When a DID is anchored on-chain (has a `txHash`), an SBT visual card appears automatically on the Identity Detail page.

### Visual Card Features
- Dark metallic gradient design
- Token ID: 7-digit number derived from `parseInt(did.slice(-8), 16)`
- Holder name, DID, identity type
- Animated green "Active" status indicator
- "Non-transferable · Cannot be sold" label
- "Soulbound Token · Sepolia" network badge

### Reference Smart Contract

`script/DIDSoulboundToken.sol` — ERC-5114 implementation:
- Extends ERC-721 (non-transferable override)
- `mintSBT(address to, string did, string ipfsHash)` — mints token to identity holder
- `transferFrom` and `safeTransferFrom` revert with `"SBT: non-transferable"`
- Token URI returns IPFS metadata

---

## IPFS Certificate Storage

Every registered DID has a verifiable credential stored on IPFS via Pinata.

### Citizen Certificate Structure

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "NationalIdentityCredential"],
  "issuer": "did:elpeef:authority:imigrasi-ri",
  "issuanceDate": "2026-03-17T00:00:00Z",
  "credentialSubject": {
    "id": "did:elpeef:citizen:6403...",
    "idType": "NIK",
    "idHash": "sha256:6403acf8...",
    "fullName": "John Doe",
    "country": "ID"
  },
  "proof": {
    "type": "HashProof",
    "algorithm": "SHA-256"
  }
}
```

### Visitor Certificate Structure

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "VisaCredential"],
  "issuer": "did:elpeef:authority:imigrasi-ri",
  "credentialSubject": {
    "id": "did:elpeef:visitor:9388...",
    "fullName": "Ahmad Fikri Santoso",
    "nationality": "Malaysia"
  },
  "visa": {
    "type": "tourist",
    "passportNumber": "XD999TEST1",
    "expiry": "2026-06-17T00:00:00Z"
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature",
    "verificationMethod": "did:elpeef:authority:imigrasi-ri#key-1"
  }
}
```

---

## Database Schema

```
identities
├── id (serial PK)
├── id_type        — 'NIK' | 'KK'
├── id_number      — unique
├── full_name
├── did            — unique, did:elpeef:citizen:<hex>
├── tx_hash        — Sepolia txHash
├── ipfs_hash      — Pinata IPFS CID
├── status         — 'pending' | 'registered'
└── created_at

visa_identities
├── id (serial PK)
├── visa_type      — 'tourist' | 'work' | 'business'
├── passport_number — unique
├── full_name
├── nationality
├── visa_expiry    — timestamp
├── did            — unique, did:elpeef:visitor:<hex>
├── kyc_url
├── audit_url
├── tx_hash
├── ipfs_hash
├── status         — 'pending' | 'registered' | 'flagged'
├── flagged_at     — timestamp when overstay was detected
└── created_at

overstay_events
├── id (serial PK)
├── event          — 'OVERSTAY_DETECTED' | 'STATUS_CHANGED'
├── did
├── timestamp
├── status         — 'flagged'
└── metadata       — jsonb (fullName, nationality, overstayDuration, ...)

verifications
├── id (serial PK)
├── did
├── verified_at
├── verifier_name
├── verification_reason
└── result         — 'verified' | 'rejected' | 'pending'

fraud_flags
├── id (serial PK)
├── did
├── flag_type      — 'duplicate_nik' | 'suspicious_pattern' | 'manual_report'
├── description
├── severity       — 'low' | 'medium' | 'high' | 'critical'
├── resolved
├── related_dids   — text[]
├── flagged_at
└── resolved_at
```

---

## Contributing

Contributions are welcome. For questions or collaboration, open an issue or submit a pull request.

---

## License

MIT
