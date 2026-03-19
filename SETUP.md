# SETUP.md — SatuIdentitas Local Development Guide

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| npm | 10+ | Package manager |
| PostgreSQL | 14+ | Database |
| MetaMask | Latest | Browser extension for on-chain features |
| Git | Any | Version control |

You also need accounts on:
- [Pinata](https://app.pinata.cloud) — IPFS storage for DID certificates
- [Infura](https://app.infura.io) — Sepolia RPC endpoint
- [Google AI Studio](https://aistudio.google.com/app/apikey) — Gemini API key for SatuBot

---

## 1. Clone the Repository

```bash
git clone https://github.com/mrbrightsides/satu-identitas.git
cd satu-identitas
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set each variable:

```env
# ─── Backend (Runtime) ────────────────────────────────────────────────────────

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/satu_identitas

# Secret for signing offline JWT credentials — generate with: openssl rand -base64 32
SESSION_SECRET=your-long-random-secret-here

# Pinata JWT for IPFS uploads (JWT only — no API key/secret needed)
# Get from: https://app.pinata.cloud/keys → New Key → copy the JWT
PINATA_JWT=eyJhbGciOiJSUzI1NiJ9...

# Google Gemini API key for SatuBot chatbot
# Get from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# ─── Frontend (Build-time, must be prefixed with VITE_) ───────────────────────

# Infura project key for Sepolia RPC (read-only blockchain queries)
# Get from: https://app.infura.io → create project → copy API key
VITE_INFURA_KEY=your-infura-project-key-here

# DIDRegistry smart contract address on Sepolia (default is the deployed contract)
VITE_CONTRACT_ADDRESS=0xc0B12ACf49BA12655ae561f102FF8d22D2d9902C
```

> **Note on `VITE_` variables:** These are bundled into the frontend at build time by Vite. In development, the Vite dev server reads them from `.env` automatically. In production (e.g., Render), they must be set as environment variables **before** triggering a build.

---

## 4. Set Up the Database

Make sure PostgreSQL is running, then push the Drizzle schema:

```bash
npm run db:push
```

This creates all required tables:
- `identities` — citizen DID records (NIK/KK)
- `visa_identities` — visitor/tourist DID records
- `verifications` — verification history log
- `fraud_flags` — fraud detection records
- `overstay_events` — overstay detection event log

---

## 5. Start the Development Server

```bash
npm run dev
```

This starts a single server on **port 5000** that serves both:
- The Express REST API at `/api/*`
- The React frontend (via Vite middleware) at `/`

Open your browser at `http://localhost:5000`.

---

## 6. MetaMask Setup (for Blockchain Features)

To test on-chain DID registration, you need MetaMask configured for Sepolia:

1. Install [MetaMask](https://metamask.io) browser extension
2. Create or import a wallet
3. Switch network to **Sepolia Testnet** (Settings → Networks → Add Network if not listed)
4. Get free Sepolia ETH from a faucet:
   - [sepoliafaucet.com](https://sepoliafaucet.com)
   - [faucet.sepolia.dev](https://faucet.sepolia.dev)
5. You need approximately **0.001–0.01 ETH** per DID registration transaction

> If MetaMask is not installed, the app still works — IPFS certificate upload and database registration succeed. The "Anchor on Blockchain" step can be done later from the Identity Detail page.

---

## 7. Verify Everything Works

Run a quick check against the API:

```bash
# Health check — should return a list (empty array is fine)
curl http://localhost:5000/api/identities

# Trigger overstay monitor manually (demo mode)
curl -X POST http://localhost:5000/api/overstay-events/trigger
```

---

## Project Structure

```
satu-identitas/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # Route-level page components
│       ├── components/      # Shared UI components
│       │   └── layout/      # Navbar, Footer
│       ├── hooks/           # TanStack Query + blockchain hooks
│       └── lib/             # queryClient, utils
├── server/                  # Express backend
│   ├── index.ts             # Entry point
│   ├── routes.ts            # All API route handlers
│   ├── storage.ts           # DatabaseStorage class (Drizzle ORM)
│   ├── ipfs.ts              # Pinata IPFS upload helpers
│   ├── gemini.ts            # Gemini AI client (SatuBot)
│   └── overstay-monitor.ts  # Background visa expiry checker
├── shared/                  # Shared between client and server
│   ├── schema.ts            # Drizzle schema + Zod types
│   ├── routes.ts            # Typed API route definitions
│   └── blockchain.ts        # Contract ABI + Sepolia config
├── script/                  # Smart contract reference files
│   └── DIDSoulboundToken.sol
├── DIDRegistry.sol          # On-chain DID Registry contract
├── .env.example             # Environment variable template
└── replit.md                # Developer reference notes
```

---

## Build for Production

```bash
npm run build   # Builds frontend into dist/
npm start       # Starts Express serving the built frontend
```

In production, all `VITE_*` environment variables must be available **at build time** (before `npm run build` runs).

---

## Deploying to Render

1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Add a **PostgreSQL** database — Render will auto-inject `DATABASE_URL`
4. Set all environment variables in Render's dashboard:
   - `SESSION_SECRET` (generate with `openssl rand -base64 32`)
   - `PINATA_JWT`
   - `GEMINI_API_KEY`
   - `VITE_INFURA_KEY`
   - `VITE_CONTRACT_ADDRESS`
5. Set **Build Command:** `npm install && npm run build`
6. Set **Start Command:** `npm start`
7. Deploy — Render will run the build and start the server

> `VITE_INFURA_KEY` and `VITE_CONTRACT_ADDRESS` must be set as environment variables in Render **before** the build step runs, since Vite bundles them at compile time.
