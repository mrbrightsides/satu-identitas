import { motion } from "framer-motion";
import { SiGithub } from "react-icons/si";
import {
  ShieldCheck, Lightbulb, Cpu, AlertTriangle, Trophy, GraduationCap,
  Rocket, Lock, Fingerprint, Globe, QrCode, Users, AlertOctagon,
  Bot, CreditCard, CheckCircle2, Database, ExternalLink, Layers,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center text-center mb-10">
      <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">{title}</h2>
      {subtitle && <p className="mt-2 text-muted-foreground max-w-xl">{subtitle}</p>}
    </div>
  );
}

const features = [
  { icon: Fingerprint, label: "Citizen DID", desc: "NIK/KK → on-chain DID via MetaMask. Only SHA-256(NIK) stored — never the raw ID." },
  { icon: Globe, label: "Visitor DID", desc: "Temporary DID for tourists, work & business visa holders with built-in expiry enforcement." },
  { icon: Lock, label: "Blockchain Anchoring", desc: "DIDRegistry.sol on Sepolia. Immutable once registered — verifiable by anyone on Etherscan." },
  { icon: Database, label: "IPFS Certificates", desc: "W3C Verifiable Credentials uploaded to Pinata IPFS. Permanent, decentralized storage." },
  { icon: QrCode, label: "QR Verification", desc: "Two modes: on-chain (Etherscan) and offline HMAC-SHA256 JWT — works without internet." },
  { icon: Users, label: "Batch Verification API", desc: "Verify hundreds of DIDs in one API call. Returns status, txHash, and fraud flags per DID." },
  { icon: AlertOctagon, label: "Fraud Detection", desc: "Duplicate NIK detection, suspicious pattern analysis, manual reporting. Risk levels: low → critical." },
  { icon: AlertTriangle, label: "Overstay Detection", desc: "Background monitor every 30 seconds. Auto-flags expired visa holders with structured event logs." },
  { icon: Bot, label: "SatuBot AI", desc: "Google Gemini 2.0 Flash chatbot. Context-aware, multi-turn, responds in Bahasa or English." },
  { icon: CreditCard, label: "Soulbound Token", desc: "Non-transferable ERC-5114 SBT card auto-displayed when DID is anchored on-chain." },
];

const stack = [
  { layer: "Frontend", tech: "React 18, TypeScript, Vite, TanStack Query v5, Wouter, shadcn/ui, Framer Motion" },
  { layer: "Backend", tech: "Node.js, Express 5, TypeScript, tsx" },
  { layer: "Database", tech: "PostgreSQL via Drizzle ORM + drizzle-zod" },
  { layer: "Blockchain", tech: "Solidity, ethers.js v6, MetaMask, Ethereum Sepolia" },
  { layer: "Storage", tech: "Pinata IPFS (W3C Verifiable Credentials)" },
  { layer: "AI", tech: "Google Gemini 2.0 Flash (@google/generative-ai)" },
  { layer: "Security", tech: "SHA-256 (on-chain privacy), HMAC-SHA256 (offline JWT)" },
];

const challenges = [
  {
    title: "Privacy on a Public Ledger",
    desc: "Every Sepolia transaction is publicly readable. We hash the NIK with SHA-256 on the client before the MetaMask popup appears — the raw ID never leaves the user's device.",
  },
  {
    title: "Immutability as a Double-Edged Sword",
    desc: "The smart contract prevents re-registration, which is good. But recovering state after a mid-flow rejection required scanning DIDRegistered event logs on-chain to reconstruct txHash without re-registering.",
  },
  {
    title: "True Offline Verification",
    desc: "QR codes must be verifiable without any server. We encode enough context into the JWT payload and built a self-contained browser verifier — a mini cryptographic engine in pure JavaScript.",
  },
  {
    title: "Real-Time Monitoring at Scale",
    desc: "The background overstay monitor needs idempotency — it must not re-flag already-flagged identities on every 30-second cycle. Solved with a conditional check on flaggedAt IS NULL.",
  },
  {
    title: "Wildcard Route Conflicts",
    desc: "/api/visa-identities/flagged must be registered before /api/did/:did in Express — otherwise the wildcard swallows the static path. A subtle but critical ordering issue.",
  },
];

const accomplishments = [
  "End-to-end on-chain identity flow — form → MetaMask → IPFS certificate on a live testnet",
  "Zero raw PII on the blockchain — SHA-256 hashing blocks identity scraping from the public ledger",
  "True offline QR verification — cryptographic proof without any server or internet connection",
  "Real-time overstay monitoring — auto-detection and flagging with a live event feed UI",
  "Unified DID namespace — citizens and visitors under did:elpeef:* with consistent API behavior",
  "Production-ready architecture — shared types, Zod validation on every endpoint, clean separation of concerns",
];

const learned = [
  { title: "W3C DIDs are more accessible than they look", desc: "The spec maps cleanly onto existing web infrastructure when you don't over-engineer the cryptography layer." },
  { title: "Blockchain is for immutability, not storage", desc: "Heavy data belongs on IPFS; only the minimal hash belongs on-chain. This is the right pattern for identity systems at scale." },
  { title: "SHA-256 ≠ Zero Knowledge", desc: "It's one-way and infeasible to reverse — but a true ZK proof (zk-SNARK) would let you prove identity without revealing even the hash. That's the natural next step." },
  { title: "Wallet UX is still Web3's biggest barrier", desc: "MetaMask prompts, network switching, and gas fees create friction that needs more abstraction for mainstream users." },
  { title: "Idempotency is critical for real-time monitors", desc: "Without flaggedAt IS NULL guards, a 30-second polling loop would generate thousands of duplicate overstay events." },
];

const roadmap = [
  { title: "Zero-Knowledge Proofs", desc: "Upgrade to zk-SNARK proofs so identity can be verified without revealing even the hash — true cryptographic privacy." },
  { title: "Mainnet / L2 Deployment", desc: "Migrate from Sepolia to Ethereum mainnet or a lower-cost L2 (Polygon, Optimism) for production viability." },
  { title: "DID-Auth Login", desc: "Let third-party apps authenticate users via their SatuIdentitas DID — replacing username/password with a cryptographic signature." },
  { title: "Mobile App with NFC", desc: "Embed the offline JWT into an NFC-enabled card that can be tapped against a reader for instant physical verification." },
  { title: "Government Integration API", desc: "Formal API layer for Dukcapil (civil registration) and Imigrasi (immigration) to query and update DID status." },
  { title: "Selective Disclosure", desc: "Prove specific attributes (e.g., \"I am over 18\") without revealing full identity, using W3C Verifiable Presentations." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-muted/30">

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-muted/40 border-b py-20 px-4">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial="hidden" animate="visible" variants={fadeIn}
        >
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-6">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight">
            Satu<span className="text-primary">Identitas</span>
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Decentralized Identity Platform for Indonesia
          </p>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            SatuIdentitas replaces physical KTP/NIK documents with blockchain-anchored
            Decentralized Identifiers (DIDs) on Ethereum Sepolia — giving every Indonesian
            citizen a sovereign, tamper-proof digital identity.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">W3C DID</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Ethereum Sepolia</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">IPFS via Pinata</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Gemini AI</Badge>
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">Soulbound Token</Badge>
          </div>
          <div className="mt-6">
            <a
              href="https://github.com/mrbrightsides/satu-identitas"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <SiGithub className="w-4 h-4" />
              github.com/mrbrightsides/satu-identitas
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Inspiration */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <SectionTitle icon={Lightbulb} title="Inspiration" />
          <Card>
            <CardContent className="pt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Indonesia has over <strong className="text-foreground">277 million citizens</strong>, each holding a physical
                KTP (Kartu Tanda Penduduk) as their sole proof of identity. Yet every year, millions face
                bureaucratic delays, counterfeit ID fraud, and inaccessibility — particularly those in remote
                areas or abroad. The NIK system is entirely centralized: one database breach can compromise
                an entire nation's identity records.
              </p>
              <p>
                We were inspired by the question:{" "}
                <em className="text-foreground font-medium">
                  "What if your identity was something no one could take away, forge, or manipulate — not even the government?"
                </em>
              </p>
              <p>
                Decentralized Identifiers on a public blockchain offer exactly that. Pair it with IPFS for
                tamper-proof credential storage and you have the foundation for a truly sovereign digital identity.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-background border-y py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <SectionTitle icon={Cpu} title="What It Does" subtitle="A full suite of decentralized identity tools for citizens, visitors, and verifying institutions." />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.label} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <f.icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{f.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <SectionTitle icon={Lock} title="Security & Privacy Design" />
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" /> Privacy-Preserving Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  The actual NIK is <strong className="text-foreground">never published to the blockchain</strong>. Only its SHA-256 hash is sent to the smart contract — computed on the client side before the MetaMask popup appears.
                </p>
                <div className="bg-white/70 dark:bg-black/20 rounded-lg p-3 font-mono text-xs space-y-1 border">
                  <p><span className="text-green-600">SHA-256(NIK)</span> → stored on-chain</p>
                  <p><span className="text-red-500">NIK</span> → never leaves the device</p>
                </div>
                <p>Even reading every Sepolia transaction reveals nothing — the hash is cryptographically irreversible.</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tamper-Proof Immutability
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  Once a DID is registered, its status is <strong className="text-foreground">permanently on-chain</strong> — not alterable by the platform, a database admin, or anyone else.
                </p>
                <div className="bg-white/70 dark:bg-black/20 rounded-lg p-3 font-mono text-xs border">
                  <p className="text-purple-600">require(</p>
                  <p className="pl-4">!identities[_did].exists,</p>
                  <p className="pl-4 text-orange-500">"DID already registered"</p>
                  <p className="text-purple-600">);</p>
                </div>
                <p>Any verifier can independently confirm DID status on Etherscan — no reliance on SatuIdentitas infrastructure.</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* Architecture */}
      <section className="bg-background border-y py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <SectionTitle icon={Layers} title="Architecture & Tech Stack" />
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-foreground w-32">Layer</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Technology</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stack.map((s, i) => (
                    <tr key={s.layer} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-5 py-3 font-medium text-primary whitespace-nowrap">{s.layer}</td>
                      <td className="px-5 py-3 text-muted-foreground">{s.tech}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-muted/40 rounded-xl border text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre overflow-x-auto">
{`Client (React + Vite)
   └── HTTP (same port)
Server (Express + TypeScript)
   ├── PostgreSQL  (Drizzle ORM)
   └── External Services
        ├── Sepolia via Infura RPC
        ├── Pinata IPFS
        └── Etherscan (tx links)`}
            </div>
          </motion.div>
        </div>
      </section>

      {/* DID Format */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <SectionTitle icon={Fingerprint} title="DID Format" subtitle="All identities share the did:elpeef:* namespace." />
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Citizen (WNI)</p>
                  <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs break-all">
                    did:elpeef:citizen:<span className="text-primary">{"<sha256_hex_of_NIK>"}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Visitor (WNA)</p>
                  <div className="bg-muted rounded-lg px-4 py-3 font-mono text-xs break-all">
                    did:elpeef:visitor:<span className="text-primary">{"<sha256_hex_of_passport>"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  The DID itself is derived from the SHA-256 hash of the ID number, so no raw PII appears even in the identifier string.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Challenges */}
      <section className="bg-background border-y py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <SectionTitle icon={AlertTriangle} title="Challenges We Ran Into" />
            <div className="space-y-4">
              {challenges.map((c, i) => (
                <motion.div key={c.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                  <Card>
                    <CardContent className="pt-5 flex gap-4">
                      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center text-destructive font-bold text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Accomplishments */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <SectionTitle icon={Trophy} title="Accomplishments We're Proud Of" />
          <div className="grid sm:grid-cols-2 gap-4">
            {accomplishments.map((a, i) => (
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <Card className="h-full">
                  <CardContent className="pt-5 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* What We Learned */}
      <section className="bg-background border-y py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
            <SectionTitle icon={GraduationCap} title="What We Learned" />
            <div className="space-y-4">
              {learned.map((l, i) => (
                <motion.div key={l.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                  <Card>
                    <CardContent className="pt-5 flex gap-4">
                      <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{l.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
          <SectionTitle icon={Rocket} title="What's Next for SatuIdentitas" subtitle="The roadmap toward a production-grade national identity layer for Indonesia." />
          <div className="grid sm:grid-cols-2 gap-5">
            {roadmap.map((r, i) => (
              <motion.div key={r.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <Card className="h-full border-primary/20 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {i + 1}
                      </div>
                      {r.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="bg-primary/5 border-t py-16 px-4">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
        >
          <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground">Open Source & Open to Collaboration</h2>
          <p className="mt-3 text-muted-foreground">
            SatuIdentitas is built in the open. Contributions, feedback, and integrations are welcome.
          </p>
          <a
            href="https://github.com/mrbrightsides/satu-identitas"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <SiGithub className="w-4 h-4" />
            View on GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
