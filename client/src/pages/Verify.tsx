import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, ShieldCheck, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Verify() {
  const [did, setDid] = useState("");
  const [, setLocation] = useLocation();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (did.trim()) {
      // Remove any prefix if user pasted the full URI incorrectly or correctly
      const cleanDid = did.trim();
      setLocation(`/did/${cleanDid}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-[0.2] pointer-events-none"></div>
      
      <div className="max-w-xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-primary/10 mb-8">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Verify Identity
          </h1>
          <p className="text-lg text-muted-foreground mb-10 text-balance mx-auto">
            Enter a Decentralized Identifier (DID) to check its authenticity and registration status on the blockchain.
          </p>

          <Card className="shadow-2xl shadow-black/5 border-border/60">
            <CardContent className="p-8">
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    required
                    value={did}
                    onChange={(e) => setDid(e.target.value)}
                    className="pl-12 h-14 rounded-xl text-lg border-border/60 focus:ring-primary/20"
                    placeholder="Enter DID (e.g. did:elpeef:citizen:0x...)"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-md">
                  Verify <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            Connected to Sepolia Testnet
          </div>
        </motion.div>
      </div>
    </div>
  );
}
