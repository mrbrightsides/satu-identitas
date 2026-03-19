# Business Model Overview — SatuIdentitas

> Decentralized Identity Infrastructure for Indonesia's Digital Government Transformation

---

## Executive Summary

SatuIdentitas is a blockchain-anchored Decentralized Identity (DID) platform that replaces physical KTP/NIK documents with cryptographically verifiable digital identities. Built on open standards (W3C DID, Verifiable Credentials) and deployed on Ethereum, the platform is designed to serve as a sovereign identity layer for Indonesian citizens, government agencies, and private institutions.

The core value proposition: **a citizen's identity becomes tamper-proof, portable, and verifiable by anyone — without sharing raw personal data.**

---

## Problem & Market Context

| Problem | Current State | Impact |
|---|---|---|
| Identity fraud | NIK duplication is common in KTP forgery cases | Financial loss, broken social services |
| Bureaucratic friction | Physical KTP required for every service | Millions of unserved citizens in remote areas |
| Centralized single point of failure | One Dukcapil DB breach = national identity compromise | National security risk |
| Visa overstay enforcement | Manual, reactive, and slow | Immigration compliance gaps |
| Inter-agency data silos | Hospitals, banks, Imigrasi cannot cross-verify identities efficiently | Duplicated KYC costs |

Indonesia's digital economy is projected to reach **$130 billion by 2030** (Google-Temasek-Bain). Identity infrastructure is the foundational layer — and it remains the weakest link.

---

## Value Proposition by Segment

### 🏛️ Government Agencies (Primary)

| Agency | Use Case | Value Delivered |
|---|---|---|
| **Dukcapil** (Civil Registration) | Issue and anchor citizen DIDs on-chain | Fraud-proof NIK, immutable registration record |
| **Imigrasi** (Immigration) | Manage visitor DIDs, automate overstay detection | Real-time compliance, reduced manual enforcement |
| **BPJS Kesehatan** | Verify patient identity without physical KTP | Faster onboarding, reduced claim fraud |
| **KPU** (Elections Commission) | Voter identity verification | Tamper-proof voter roll, reduced ghost voters |
| **Kemnaker** (Ministry of Manpower) | Work visa DID for foreign workers | Automated permit expiry tracking |

### 🏦 Financial Institutions (Secondary)

- **Banks & Fintech:** Replace KYC photocopies with a cryptographic DID check via the Batch Verification API — reducing onboarding time from days to seconds
- **Insurance:** Instant identity verification at claim time
- **P2P Lending:** Reduce synthetic identity fraud

### 🏥 Healthcare & Social Services

- Hospitals: Patient identity verification without physical cards
- BPJS: Fraud-proof benefit distribution
- Social aid programs (Bansos): Ensure aid reaches the correct beneficiary

### ✈️ Travel & Hospitality

- Hotels: Automated visa validity check for foreign guests
- Airlines: Crew-facing DID verification tool
- Tourism boards: Real-time visitor compliance dashboards

---

## Revenue Model

### Tier 1 — Government SaaS (B2G)

| Package | Target | Pricing Model |
|---|---|---|
| **Starter** | Pilot program with 1 agency | Fixed annual license fee |
| **Enterprise** | Dukcapil / Imigrasi national rollout | Per-citizen DID anchored (volume pricing) |
| **Custom Integration** | Full API + on-premise / hybrid deployment | Project-based + annual support retainer |

Estimated ticket size: **Rp 500 juta – Rp 10 miliar/year** per agency, depending on scope and integration depth.

### Tier 2 — API Access (B2B)

| Plan | Volume | Price |
|---|---|---|
| **Free** | 100 verifications/month | Rp 0 |
| **Business** | Up to 50.000 verifications/month | Rp 2.500/verification |
| **Enterprise** | Unlimited + SLA | Negotiated contract |

Revenue drivers: Batch Verification API calls, fraud detection checks, JWT issuance.

### Tier 3 — Transaction Fees (On-Chain)

- Small fee (in IDR-equivalent stablecoin or fiat gateway) per DID anchoring transaction
- Revenue split: platform fee + gas cost coverage
- Applicable when SatuIdentitas manages wallet infrastructure on behalf of citizens (custodial mode)

### Tier 4 — White-Label Licensing

- License the DID platform to other ASEAN countries facing similar identity challenges
- Markets: Philippines, Vietnam, Bangladesh — all have national ID modernization programs
- Model: Technology licensing fee + implementation services

---

## Go-to-Market Strategy

### Phase 1 — Proof of Concept (Current: Hackathon)
- ✅ Open-source platform published on GitHub
- ✅ Live on Ethereum Sepolia testnet
- ✅ Core features: DID registration, IPFS certificates, QR verification, overstay detection, AI chatbot

### Phase 2 — Pilot Program (6–12 months)
- Target: 1 Dinas Kependudukan (district-level Dukcapil office)
- Goal: Register 1.000–10.000 real citizen DIDs in a controlled environment
- Funding: Hackathon prize → early grant (LPDP Digital, Kominfo Digital Talent, USAID)
- Deliverable: Impact report + data for national proposal

### Phase 3 — National Proposal (12–24 months)
- Present pilot results to **Kominfo** (Ministry of Communications) and **Dukcapil Pusat**
- Align with Indonesia's **SPBE** (Sistem Pemerintahan Berbasis Elektronik) roadmap
- Pursue **PSrE (Penyelenggara Sertifikasi Elektronik)** certification from BSSN for legal recognition of DIDs
- Apply for **GovTech Edu** and **UMKM Digital** grants

### Phase 4 — Scale & Monetize (24–48 months)
- National rollout with Dukcapil: anchor all new KTP issuances as DIDs
- B2B API launch: onboard banks, fintech, and insurance companies
- ASEAN expansion: pilot in Philippines and Vietnam

---

## Key Partnerships Required

| Partner Type | Target Organizations | Role |
|---|---|---|
| **Regulatory anchor** | Kominfo, BSSN, Dukcapil | Legal recognition, data access, pilot approval |
| **Cloud / infrastructure** | AWS GovCloud, Telkom Cloud | Hybrid on-premise deployment for sensitive data |
| **Blockchain infrastructure** | Ethereum Foundation, Polygon Labs | Mainnet / L2 support, gas subsidies |
| **Systems integrator** | Accenture ID, Telkom Sigma, Lintasarta | Enterprise deployment, government relationships |
| **Financial partner** | BNI, BRI, OJK | Pilot integration for KYC use case |
| **Legal & compliance** | Hukumonline, BSSN-certified law firm | PSrE certification, data sovereignty compliance |

---

## Regulatory Landscape

### UU PDP (Personal Data Protection Law, 2022)
SatuIdentitas is designed for compliance:
- Raw NIK is **never stored on the blockchain** — only SHA-256 hash
- Citizens retain control of their identity data
- IPFS certificates can be revoked or updated by the issuing authority
- No cross-border data transfer by default (IPFS gateway is configurable)

### SPBE (Government Digital Systems)
- SatuIdentitas aligns with the SPBE mandate for interoperable digital government services
- W3C DID standard enables cross-agency identity sharing without duplicating databases

### PSrE Certification (BSSN)
- Required for DIDs to be legally recognized as electronic signatures in Indonesia
- Certification path: apply as **PSrE Tidak Tersertifikasi** initially, then pursue full certification
- Estimated timeline: 12–18 months

### ASEAN Digital Governance
- ASEAN DEFA (Digital Economy Framework Agreement) — positions Indonesia as a regional identity infrastructure provider

---

## Competitive Landscape

| Competitor | Approach | SatuIdentitas Advantage |
|---|---|---|
| **IKD (Identitas Kependudukan Digital)** — Dukcapil's own app | Centralized app, no blockchain | Decentralized, tamper-proof, no single point of failure |
| **MyInfo (Singapore)** | Government-run centralized API | SatuIdentitas is open-source and citizen-sovereign |
| **Civic / Worldcoin** | Global blockchain identity | Indonesia-specific, Bahasa support, regulatory alignment |
| **Bank-issued e-KYC** | Siloed per institution | Portable across all institutions via open API |

**Key differentiator:** SatuIdentitas is the only Indonesia-native platform combining W3C DID standards, on-chain immutability, IPFS verifiable credentials, real-time overstay detection, and an AI assistant — all open-source.

---

## Cost Structure

### Technology Costs
| Item | Estimated Cost |
|---|---|
| Cloud hosting (backend + DB) | Rp 3–10 juta/month (scales with users) |
| Sepolia / mainnet gas fees | ~$0.50–2.00 per DID registration (L2 reduces this ~100x) |
| Pinata IPFS storage | ~$0.15/GB/month |
| Gemini API (SatuBot) | Usage-based, ~$0.001 per conversation |
| Infura RPC | Free tier for 100k requests/day; paid plan for scale |

### Operational Costs
- Core team: 2–4 engineers + 1 BD + 1 regulatory/legal advisor
- Legal & compliance: PSrE certification, UU PDP legal review
- Government relations: BD activities, proposal writing, pilot management

---

## Impact Metrics (for Government Pitch)

| Metric | Current Baseline | Target (Year 1 Pilot) |
|---|---|---|
| DIDs registered | Demo data | 10.000 citizen DIDs |
| KYC time (bank onboarding) | 3–5 days | < 5 minutes |
| Overstay detection time | Days (manual) | < 30 seconds (automated) |
| Identity fraud incidents prevented | Unknown | Measurable via duplicate detection |
| Cross-agency verification calls | 0 | 50.000/month |

---

## Why Now

1. **Indonesia's digital transformation is accelerating** — Perpres 82/2023 mandates SPBE implementation across all ministries by 2025
2. **UU PDP is in force** — organizations are actively looking for compliant identity solutions
3. **Post-COVID digital trust gap** — remote identity verification is no longer optional
4. **Blockchain is mature enough** — Sepolia → L2 migration makes gas costs negligible for government use
5. **Open-source credibility** — a working, publicly auditable codebase is a stronger pitch than a slide deck

---

*SatuIdentitas — One Identity. Sovereign. Verifiable. Yours.*
