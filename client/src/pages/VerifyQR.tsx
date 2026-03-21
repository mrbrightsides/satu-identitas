import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, ArrowLeft, ScanLine, Camera, CameraOff,
  Clock, Globe, BadgeCheck, Fingerprint, Loader2, FileKey2, KeyboardIcon,
  CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface VerifyResult {
  valid: boolean;
  message?: string;
  payload?: {
    did: string;
    fullName: string;
    identityType: 'citizen' | 'visitor';
    status: string;
    iss: string;
    iat: number;
    exp: number;
    idType?: string;
    idHash?: string;
    nationality?: string;
    visaType?: string;
    passportHash?: string;
    visaExpiry?: string;
    txHash?: string;
  };
}

function QRCameraScanner({ onScan }: { onScan: (text: string) => void }) {
  const scannerRef = useRef<any>(null);
  const divId = "qr-camera-scanner-div";
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let active = true;
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const html5QrCode = new Html5Qrcode(divId);
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText: string) => { if (active) onScan(decodedText); },
          () => {}
        );
        if (active) setStarted(true);
      } catch (err: any) {
        if (!active) return;
        const msg = String(err?.message ?? err);
        if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
          setError("Camera access denied. Please allow camera permission.");
        } else if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("no camera")) {
          setError("No camera found on this device.");
        } else {
          setError("Could not start camera: " + msg);
        }
      }
    };
    startScanner();
    return () => {
      active = false;
      const sc = scannerRef.current;
      if (sc) sc.stop().catch(() => {}).finally(() => { try { sc.clear(); } catch {} });
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="p-3 bg-red-100 rounded-full">
          <CameraOff className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-sm text-red-600 max-w-xs">{error}</p>
        <p className="text-xs text-muted-foreground">Switch to Paste Token mode instead.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full overflow-hidden rounded-xl border-2 border-primary/30 bg-black min-h-[260px]">
        {!started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}
        <div id={divId} className="w-full" />
        {started && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-white/40 rounded-lg relative">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br" />
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-primary/80"
                animate={{ top: ["10%", "88%", "10%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">Point camera at a SatuIdentitas QR code</p>
    </div>
  );
}

export default function VerifyQR() {
  const [mode, setMode] = useState<"paste" | "camera">("paste");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const { toast } = useToast();

  const verify = async (jwtToken?: string) => {
    const t = (jwtToken ?? token).trim();
    if (!t) {
      toast({ variant: "destructive", title: "No token", description: "Paste or scan a JWT token first." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/verify-jwt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, message: "Network error." });
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (text: string) => {
    if (scanned) return;
    setScanned(true);
    setToken(text);
    setMode("paste");
    toast({ title: "QR Scanned", description: "Token captured — verifying now..." });
    setTimeout(() => verify(text), 300);
  };

  const handleModeChange = (newMode: "paste" | "camera") => {
    setMode(newMode);
    setResult(null);
    setScanned(false);
  };

  const formatDate = (unix: number) =>
    new Date(unix * 1000).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

  const isExpired = result?.payload?.exp
    ? result.payload.exp < Math.floor(Date.now() / 1000)
    : false;

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileKey2 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold">Offline QR Verifier</h1>
            </div>
            <p className="text-muted-foreground ml-14">Verify credentials without blockchain access.</p>
          </div>

          <Card className="border-border shadow-md mb-6">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => handleModeChange("paste")}
                  data-testid="tab-paste-token"
                  className={"flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all " + (mode === "paste" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <KeyboardIcon className="w-4 h-4" /> Paste Token
                </button>
                <button
                  onClick={() => handleModeChange("camera")}
                  data-testid="tab-scan-camera"
                  className={"flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all " + (mode === "camera" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Camera className="w-4 h-4" /> Scan QR
                </button>
              </div>

              {mode === "paste" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ScanLine className="w-4 h-4" /> Paste JWT token
                  </div>
                  <Textarea
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="font-mono text-xs min-h-[120px] resize-none"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    data-testid="input-jwt-token"
                  />
                  <Button onClick={() => verify()} disabled={loading || !token.trim()} className="w-full" data-testid="button-verify-jwt">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : <><ShieldCheck className="w-4 h-4 mr-2" /> Verify Credential</>}
                  </Button>
                </div>
              )}

              {mode === "camera" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Camera className="w-4 h-4" /> Point camera at QR code
                  </div>
                  <QRCameraScanner onScan={handleScan} />
                  {scanned && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> QR scanned — verifying...
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">HMAC-SHA256 signature check — no internet needed</p>
            </CardContent>
          </Card>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking signature...</p>
            </motion.div>
          )}

          <AnimatePresence>
            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                {result.valid && result.payload ? (
                  <Card className="border-green-200 shadow-lg overflow-hidden">
                    <div className="h-1.5 w-full bg-green-500" />
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-full"><ShieldCheck className="w-6 h-6 text-green-600" /></div>
                        <div>
                          <p className="font-bold text-green-700 text-lg">Credential Valid</p>
                          <p className="text-sm text-green-600">Signature verified</p>
                        </div>
                        <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">{result.payload.identityType === "citizen" ? "WNI" : "Visitor"}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoRow icon={<BadgeCheck className="w-4 h-4" />} label="Full Name" value={result.payload.fullName} />
                        <InfoRow icon={<Fingerprint className="w-4 h-4" />} label="Type" value={result.payload.identityType === "citizen" ? "WNI — " + (result.payload.idType ?? "") : "Visitor — " + (result.payload.visaType ?? "")} />
                        {result.payload.idHash && <InfoRow icon={<FileKey2 className="w-4 h-4" />} label="ID Hash" value={result.payload.idHash.substring(0, 16) + "..."} mono />}
                        {result.payload.passportHash && <InfoRow icon={<FileKey2 className="w-4 h-4" />} label="Passport Hash" value={result.payload.passportHash.substring(0, 16) + "..."} mono />}
                        {result.payload.nationality && <InfoRow icon={<Globe className="w-4 h-4" />} label="Nationality" value={result.payload.nationality} />}
                        {result.payload.visaExpiry && <InfoRow icon={<Clock className="w-4 h-4" />} label="Visa Expiry" value={new Date(result.payload.visaExpiry).toLocaleDateString("id-ID", { dateStyle: "long" })} />}
                        <InfoRow icon={<Clock className="w-4 h-4" />} label="Issued At" value={formatDate(result.payload.iat)} />
                        <InfoRow icon={<Clock className="w-4 h-4" />} label={isExpired ? "Expired At" : "Valid Until"} value={formatDate(result.payload.exp)} highlight={isExpired ? "red" : "green"} />
                        <div className="sm:col-span-2"><InfoRow icon={<Fingerprint className="w-4 h-4" />} label="DID" value={result.payload.did} mono /></div>
                        <div className="sm:col-span-2"><InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="Issuer" value={result.payload.iss} mono /></div>
                        {result.payload.txHash && <div className="sm:col-span-2"><InfoRow icon={<BadgeCheck className="w-4 h-4" />} label="Blockchain Tx" value={result.payload.txHash.substring(0, 20) + "..."} mono highlight="green" /></div>}
                      </div>
                      {isExpired && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 shrink-0" /> This credential has expired.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-red-200 shadow-md overflow-hidden">
                    <div className="h-1.5 w-full bg-red-500" />
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="p-2 bg-red-100 rounded-full shrink-0"><XCircle className="w-6 h-6 text-red-600" /></div>
                      <div>
                        <p className="font-bold text-red-700 text-lg">Credential Invalid</p>
                        <p className="text-sm text-red-600 mt-1">{result.message ?? "The token could not be verified."}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono = false, highlight }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: "green" | "red";
}) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">{icon}{label}</div>
      <p className={"text-sm font-medium break-all " + (mono ? "font-mono " : "") + (highlight === "green" ? "text-green-700" : highlight === "red" ? "text-red-600" : "text-foreground")}>{value}</p>
    </div>
  );
}
