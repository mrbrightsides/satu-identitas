import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Fingerprint, Lock, Globe2, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 flex items-center justify-center overflow-hidden min-h-[90vh]">
        {/* landing page hero jakarta skyline modern architecture */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=2070&auto=format&fit=crop"
            alt="Jakarta Skyline"
            className="w-full h-full object-cover"
          />
          {/* Elegant dark wash to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60 backdrop-blur-[2px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-6 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                Live on Sepolia Testnet
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.1] text-balance">
                Your Identity, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-primary">Decentralized.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl leading-relaxed">
                Transform your NIK or Kartu Keluarga into a permanent, secure, and verifiable Decentralized Identifier (DID). Eliminate the need for physical copies and vulnerable selfies.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white border-0 shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)] transition-all hover:scale-105 w-full sm:w-auto">
                    Create Your DID <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all w-full sm:w-auto">
                    Verify Identity
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="hidden lg:block relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-purple-600/30 blur-3xl opacity-50 rounded-full"></div>
              <div className="glass-panel rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                
                <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Verified Credential</p>
                      <p className="text-white font-display font-bold text-xl">Indonesia DID</p>
                    </div>
                  </div>
                  <QrCode className="w-10 h-10 text-white/40" />
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div>
                    <p className="text-white/50 text-sm mb-1">DID Identifier</p>
                    <p className="text-white font-mono text-sm bg-black/30 p-3 rounded-lg border border-white/5 break-all">
                      did:elpeef:citizen:0x7a2b9c4...8f1d3e5a
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/50 text-sm mb-1">Status</p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/20 text-green-300 text-sm font-medium border border-green-500/20">
                        <ShieldCheck className="w-4 h-4" /> Registered
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-sm mb-1">Network</p>
                      <p className="text-white font-medium">Sepolia</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background bg-grid-pattern relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              A New Era for Indonesian Identity
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Say goodbye to unsecure physical copies and welcome a cryptographic standard built for privacy and efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="w-6 h-6 text-primary" />,
                title: "Cryptographically Secure",
                desc: "Your data is hashed and anchored to the blockchain. No raw NIK data is exposed on the public ledger."
              },
              {
                icon: <Fingerprint className="w-6 h-6 text-primary" />,
                title: "Anti-Theft Protocol",
                desc: "Replaces the need for risky 'Selfie with KTP' verifications. You control who verifies your DID."
              },
              {
                icon: <Globe2 className="w-6 h-6 text-primary" />,
                title: "Universal Verification",
                desc: "Any institution can instantly verify your DID via smart contract without needing complex centralized APIs."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold font-display text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
