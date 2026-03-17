# SatuIdentitas — Project Reference

## Overview
Decentralized Identity (DID) platform for Indonesia. Replaces physical KTP/NIK with blockchain-anchored DIDs on Ethereum Sepolia.

## Architecture
- **Frontend**: React 18 + Vite, TanStack Query v5, Wouter routing, shadcn/ui
- **Backend**: Express 5 + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Blockchain**: ethers.js v6, MetaMask, Sepolia testnet
- **IPFS**: Pinata
- **Auth/Signing**: HMAC-SHA256 JWT

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod types for all tables
- `shared/routes.ts` — Typed API route definitions
- `server/routes.ts` — Express API handlers
- `server/storage.ts` — DatabaseStorage class implementing IStorage
- `server/ipfs.ts` — Pinata IPFS upload helpers
- `server/overstay-monitor.ts` — Background job (setInterval) for overstay detection
- `server/index.ts` — App entry point, starts overstay monitor on boot
- `client/src/App.tsx` — Route registry
- `client/src/pages/` — All page components
- `client/src/hooks/use-blockchain.ts` — MetaMask + ethers.js hooks
- `client/src/hooks/use-identities.ts` — TanStack Query hooks
- `DIDRegistry.sol` — On-chain DID Registry contract source
- `script/DIDSoulboundToken.sol` — ERC-5114 SBT reference contract

## Deployed Contract
- **Network**: Sepolia testnet
- **Address**: `0xc0B12ACf49BA12655ae561f102FF8d22D2d9902C`
- **RPC**: `https://sepolia.infura.io/v3/<INFURA_KEY>`

## DID Format
- Citizen: `did:elpeef:citizen:<sha256_hex_of_NIK>`
- Visitor: `did:elpeef:visitor:<sha256_hex_of_passport>`

## Database Tables
- `identities` — Citizen DIDs (NIK/KK)
- `visa_identities` — Visitor DIDs with expiry, status (pending/registered/flagged), flaggedAt
- `verifications` — Verification history per DID
- `fraud_flags` — Fraud detection records
- `overstay_events` — Overstay event log with JSON metadata

## Pages
- `/` Home, `/register` Citizen, `/visa-register` Visitor
- `/verify` Lookup, `/verify-qr` Offline JWT verification
- `/overstay-monitor` Real-time immigration compliance
- `/dashboard` Overview
- `/did/:did` Identity detail with SBT card and QR toggle

## API Notes
- `/api/did/:did` — Unified endpoint: checks both `identities` and `visa_identities`, returns `identityType` field
- `/api/did/:did/offline-jwt` — HMAC-SHA256 JWT, 1yr citizen / 30d visitor
- `/api/visa-identities/flagged` — MUST be registered before `/:did` wildcard route
- `/api/overstay-events/trigger` — Manual trigger for demo purposes

## Chatbot (SatuBot)
- `server/gemini.ts` — Gemini 2.0 Flash client, system prompt, `generateChatResponse()`
- `client/src/components/ChatBot.tsx` — floating chatbot widget, mounted globally in App.tsx
- API: `POST /api/chat` — body: `{ message, messages[] }`, response: `{ reply }`
- Uses `GEMINI_API_KEY` env secret

## Overstay Monitor
- `server/overstay-monitor.ts` — runs `getExpiredVisas()` every 30s
- Flags visa, creates event record with duration metadata
- Started in `server/index.ts` after server binds to port
