import { useParams, Link } from "wouter";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  Download, Copy, ExternalLink, ShieldCheck, Clock, ArrowLeft,
  Zap, Loader2, Gem, WifiOff, Globe, FileKey2, Sparkles
} from "lucide-react";

import { useIdentity, useUpdateTxHash } from "@/hooks/use-identities";
import { useBlockchain } from "@/hooks/use-blockchain";
import { getEtherscanUrl } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type QRMode = 'etherscan' | 'offline';

function getSbtTokenId(did: string): string {
  const hex = did.split(':').pop()?.slice(-8) ?? '00000000';
  return String(parseInt(hex, 16)).padStart(7, '0');
}

export default function IdentityDetail() {
  const { did } = useParams<{ did: string }>();
  const { data: identity, isLoading, error, refetch } = useIdentity(did || "");
  const updateTx = useUpdateTxHash();
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const blockchain = useBlockchain();

  const [qrMode, setQrMode] = useState<QRMode>('etherscan');
  const [offlineJwt, setOfflineJwt] = useState<string | null>(null);
  const [loadingJwt, setLoadingJwt] = useState(false);

  const downloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `SatuID-${(identity as any)?.fullName?.replace(/\s+/g, '-') ?? 'DID'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "QR Downloaded", description: "Present this QR for offline verification." });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  const getIPFSUrl = (hash: string) => `${IPFS_GATEWAY}/${hash}`;

  const fetchOfflineJwt = async () => {
    if (offlineJwt) { setQrMode('offline'); return; }
    setLoadingJwt(true);
    try {
      const encodedDid = encodeURIComponent((identity as any).did);
      const res = await fetch(`/api/did/${encodedDid}/offline-jwt`);
      const data = await res.json();
      setOfflineJwt(data.jwt);
      setQrMode('offline');
      toast({ title: "Offline QR Ready", description: `Valid for ${data.expiresIn} — works without internet.` });
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Could not generate offline QR." });
    } finally {
      setLoadingJwt(false);
    }
  };

  const isVisitor = (identity as any)?.identityType === 'visitor';
  const idNumber = isVisitor ? (identity as any)?.passportNumber : (identity as any)?.idNumber;
  const idType = isVisitor ? 'Passport' : (identity as any)?.idType;

  const registerOnBlockchain = async () => {
    if (!identity) return;
    try {
      toast({ title: "Connecting Wallet", description: "Connecting to Sepolia testnet..." });
      const txHash = await blockchain.registerDIDOnBlockchain((identity as any).did, idNumber);
      await updateTx.mutateAsync({ did: (identity as any).did, txHash });
      toast({ title: "DID Registered Successfully!", description: "Your identity has been anchored on Sepolia." });
      refetch();
    } catch (e: any) {
      if (e.message === 'ALREADY_REGISTERED') {
        toast({ title: "Found on Blockchain", description: "Recovering transaction hash..." });
        try {
          const recoveredTx = await blockchain.recoverTxHashFromChain((identity as any).did);
          if (recoveredTx) {
            await updateTx.mutateAsync({ did: (identity as any).did, txHash: recoveredTx });
            toast({ title: "Record Restored! ✅", description: "Transaction hash recovered and saved." });
            refetch();
          } else {
            toast({ variant: "default", title: "Already on Sepolia", description: "DID is on-chain but tx could not be retrieved. Check Etherscan." });
          }
        } catch {
          toast({ variant: "destructive", title: "Recovery Failed", description: "Could not retrieve the transaction hash." });
        }
      } else {
        toast({ variant: "destructive", title: "Registration Failed", description: e.message || "Could not register on blockchain." });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !identity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <ShieldCheck className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold font-display">Identity Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6 text-center max-w-md">
          The requested Decentralized Identifier could not be located in our registry.
        </p>
        <Link href="/"><Button>Return Home</Button></Link>
      </div>
    );
  }

  const isPending = (identity as any).status === "pending";
  const txHash = (identity as any).txHash;
  const identityDid = (identity as any).did;
  const sbtTokenId = getSbtTokenId(identityDid);
  const qrValue = qrMode === 'offline' && offlineJwt
    ? offlineJwt
    : (txHash ? getEtherscanUrl(txHash) : identityDid);

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── Main Info Column ── */}
          <div className="lg:col-span-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground">
                    {isVisitor ? 'Visitor Digital ID' : 'Digital Identity'}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {isVisitor ? 'Temporary DID for visa/tourist holders' : 'Managed via smart contract registry'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isVisitor && (
                    <Badge variant="secondary" className="text-sm px-3 py-1 bg-blue-100 text-blue-700">Visitor</Badge>
                  )}
                  <Badge variant={isPending ? "secondary" : "default"} className={`text-sm px-3 py-1 ${!isPending && 'bg-green-500 hover:bg-green-600'}`}>
                    {isPending
                      ? <><Clock className="w-3.5 h-3.5 mr-1.5" /> Pending Registration</>
                      : <><ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Registered Active</>}
                  </Badge>
                </div>
              </div>

              <Card className="border-border shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                    {/* Left column */}
                    <div className="p-6 space-y-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                        <p className="text-xl font-bold text-foreground">{(identity as any).fullName}</p>
                      </div>

                      {isVisitor && (identity as any).nationality && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Nationality</p>
                          <p className="text-foreground font-medium">{(identity as any).nationality}</p>
                        </div>
                      )}
                      {isVisitor && (identity as any).visaType && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Visa Type</p>
                          <p className="text-foreground font-medium capitalize">{(identity as any).visaType}</p>
                        </div>
                      )}
                      {isVisitor && (identity as any).visaExpiry && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Visa Expiry</p>
                          <p className="text-foreground font-medium">
                            {new Date((identity as any).visaExpiry).toLocaleDateString('en-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      )}

                      {(identity as any).ipfsHash && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">IPFS Certificate</p>
                          <div className="flex items-center gap-2">
                            <a href={getIPFSUrl((identity as any).ipfsHash)} target="_blank" rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-sm" data-testid="link-ipfs-gateway">
                              View on IPFS <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <span className="text-muted-foreground text-xs">•</span>
                            <button onClick={() => copyToClipboard((identity as any).ipfsHash, 'IPFS Hash')}
                              className="text-primary hover:underline flex items-center gap-1 text-sm" data-testid="button-copy-ipfs">
                              <Copy className="w-3.5 h-3.5" /> Copy Hash
                            </button>
                          </div>
                        </div>
                      )}

                      {isVisitor && (identity as any).kycUrl && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">KYC Verification</p>
                          <a href={(identity as any).kycUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                            {(identity as any).kycUrl} <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Document Linked ({idType})</p>
                        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border/50">
                          <p className="font-mono text-foreground">
                            {idNumber && idNumber.length >= 8
                              ? `${idNumber.substring(0, 4)} **** **** ${idNumber.substring(idNumber.length - 4)}`
                              : idNumber}
                          </p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => copyToClipboard(idNumber, "ID Number")}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="p-6 space-y-6 bg-slate-50/50">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Decentralized Identifier (DID)</p>
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                          <p className="font-mono text-sm text-foreground truncate mr-2" title={identityDid}>{identityDid}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => copyToClipboard(identityDid, "DID")}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Blockchain Record</p>
                        {txHash ? (
                          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100">
                            <p className="font-mono text-xs text-green-800 truncate mr-2" title={txHash}>{txHash}</p>
                            <a href={getEtherscanUrl(txHash)} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-100 rounded-md transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800 text-sm">
                            <p className="mb-3 font-medium">Action Required</p>
                            <p className="mb-4 text-yellow-700 opacity-90">This identity needs to be anchored to the Sepolia blockchain.</p>
                            <Button size="sm" onClick={registerOnBlockchain} disabled={blockchain.isRegistering || updateTx.isPending}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white w-full">
                              {blockchain.isRegistering || updateTx.isPending
                                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                : <Zap className="w-4 h-4 mr-2" />}
                              Anchor on Sepolia
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Soulbound Token Card ── */}
            <AnimatePresence>
              {txHash && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c1a2e 100%)' }}>

                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 opacity-10"
                      style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 80px)' }} />

                    <div className="relative p-6 text-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                            <Gem className="w-6 h-6 text-violet-300" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">Soulbound Token</p>
                            <p className="text-sm text-white/60 font-mono">ERC-5114 · Non-transferable</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/50 uppercase tracking-wider">Token ID</p>
                          <p className="text-2xl font-bold font-mono text-violet-200">#{sbtTokenId}</p>
                        </div>
                      </div>

                      <div className="h-px bg-white/10 mb-4" />

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Holder</p>
                          <p className="font-semibold text-white truncate">{(identity as any).fullName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">Type</p>
                          <p className="font-semibold text-white capitalize">{isVisitor ? `${(identity as any).visaType ?? ''} Visitor` : `WNI — ${idType}`}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-white/50 mb-1 uppercase tracking-wider">DID</p>
                          <p className="font-mono text-xs text-violet-200 truncate">{identityDid}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-xs text-green-300 font-medium">Active · Sepolia Testnet</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                          <span className="text-xs text-violet-300 font-semibold uppercase tracking-wider">SatuIdentitas</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-1.5">
                    <Gem className="w-3 h-3" />
                    Soulbound to wallet · Cannot be transferred or sold
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── QR Code Column ── */}
          <div className="lg:col-span-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card className="border-border shadow-lg text-center overflow-hidden">
                <div className="h-2 w-full bg-primary" />
                <CardContent className="p-6 flex flex-col items-center">

                  {/* QR Mode Toggle */}
                  <div className="flex w-full mb-5 bg-muted rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setQrMode('etherscan')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${qrMode === 'etherscan' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      data-testid="button-qr-etherscan"
                    >
                      <Globe className="w-3.5 h-3.5" /> Blockchain
                    </button>
                    <button
                      onClick={fetchOfflineJwt}
                      disabled={loadingJwt}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${qrMode === 'offline' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      data-testid="button-qr-offline"
                    >
                      {loadingJwt
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <WifiOff className="w-3.5 h-3.5" />}
                      Offline JWT
                    </button>
                  </div>

                  {/* QR Display */}
                  <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 mb-4" ref={qrRef}>
                    {qrMode === 'offline' && !offlineJwt ? (
                      <div className="w-[200px] h-[200px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <QRCodeCanvas
                        value={qrValue}
                        size={200}
                        level={qrMode === 'offline' ? 'M' : 'H'}
                        includeMargin={false}
                        fgColor="#0f172a"
                      />
                    )}
                  </div>

                  <h3 className="font-display font-bold text-base mb-1">
                    {qrMode === 'offline' ? 'Offline Credential QR' : 'Digital Credential'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {qrMode === 'offline'
                      ? 'Works without internet · HMAC-SHA256 signed'
                      : txHash ? 'Scan to view on Etherscan' : 'Scan to verify identity'}
                  </p>

                  {qrMode === 'offline' && offlineJwt && (
                    <div className="w-full mb-3 space-y-2">
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => copyToClipboard(offlineJwt, 'JWT Token')}>
                        <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy JWT
                      </Button>
                      <Link href="/verify-qr">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <FileKey2 className="w-3.5 h-3.5 mr-1.5" /> Open Verifier
                        </Button>
                      </Link>
                    </div>
                  )}

                  <Button onClick={downloadQR} className="w-full rounded-xl bg-secondary hover:bg-secondary/90 shadow-md" data-testid="button-download-qr">
                    <Download className="w-4 h-4 mr-2" /> Download QR
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
