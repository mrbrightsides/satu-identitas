import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, AlertTriangle, CheckCircle2, Users, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  const [batchInput, setBatchInput] = useState("");
  const [selectedDID, setSelectedDID] = useState("");

  // Batch verification mutation
  const batchVerification = useMutation({
    mutationFn: async (dids: string[]) => {
      const res = await apiRequest("POST", "/api/verifications/batch", {
        dids: dids.filter(d => d.trim()),
        verifierName: "Dashboard User",
        reason: "Batch Verification Check",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Verification Complete", description: "Batch verification processed successfully." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // Fraud check query
  const fraudCheck = useQuery({
    queryKey: selectedDID ? ["/api/fraud/check", selectedDID] : null,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/fraud/check/${selectedDID}`);
      return res.json();
    },
    enabled: !!selectedDID,
  });

  const handleBatchVerify = () => {
    const dids = batchInput.split("\n").map(d => d.trim()).filter(Boolean);
    if (dids.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please enter at least one DID" });
      return;
    }
    batchVerification.mutate(dids);
  };

  const downloadReport = () => {
    if (!batchVerification.data) return;
    
    const csv = [
      ["DID", "Found", "Status", "Fraud Flags", "Risk Level"].join(","),
      ...batchVerification.data.results.map((r: any) => [
        r.did,
        r.found ? "Yes" : "No",
        r.status || "N/A",
        r.fraudFlags?.length || 0,
        r.fraudFlags?.length > 0 ? "High" : "Low",
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verification-report.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-bold">Verification Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Batch verify identities and detect fraud patterns instantly</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Batch Verification */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Batch Verification</CardTitle>
                </div>
                <CardDescription>Verify up to 1000 DIDs at once</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Enter DIDs (one per line)</label>
                  <textarea
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder="did:elpeef:citizen:abc123...&#10;did:elpeef:visitor:def456...&#10;did:elpeef:citizen:ghi789..."
                    className="w-full h-48 p-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <Button
                  onClick={handleBatchVerify}
                  disabled={batchVerification.isPending}
                  className="w-full h-10 bg-primary hover:bg-primary/90"
                >
                  {batchVerification.isPending ? "Verifying..." : "Verify Batch"}
                </Button>

                {batchVerification.data && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Checked</p>
                        <p className="text-2xl font-bold">{batchVerification.data.totalChecked}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Valid</p>
                        <p className="text-2xl font-bold text-green-600">{batchVerification.data.validDIDs}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fraud Flags</p>
                        <p className="text-2xl font-bold text-red-600">{batchVerification.data.fraudDetected}</p>
                      </div>
                    </div>

                    {batchVerification.data.fraudDetected > 0 && (
                      <div className="flex gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-700">
                          {batchVerification.data.fraudDetected} identities flagged for suspicious activity
                        </p>
                      </div>
                    )}

                    <Button onClick={downloadReport} variant="outline" size="sm" className="w-full">
                      <Download className="w-4 h-4 mr-2" /> Download Report
                    </Button>
                  </div>
                )}

                {batchVerification.data?.results && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {batchVerification.data.results.map((result: any) => (
                      <div key={result.did} className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border/30">
                        <span className="text-xs font-mono truncate flex-1">{result.did}</span>
                        {result.fraudFlags?.length > 0 ? (
                          <Badge variant="destructive" className="ml-2">Flagged</Badge>
                        ) : result.found ? (
                          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">Valid</Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-2">Not Found</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Fraud Detection */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-500/5 to-transparent">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <CardTitle>Fraud Detection</CardTitle>
                </div>
                <CardDescription>Check for fraud flags and risk assessment</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Enter DID to Check</label>
                  <Input
                    value={selectedDID}
                    onChange={(e) => setSelectedDID(e.target.value)}
                    placeholder="did:elpeef:citizen:abc123..."
                    className="border-border focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
                  />
                </div>

                {fraudCheck.isLoading && (
                  <div className="text-center py-8 text-muted-foreground">Loading fraud data...</div>
                )}

                {fraudCheck.data && (
                  <div className="space-y-3">
                    {/* Risk Level */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full ${
                          fraudCheck.data.riskLevel === 'critical' ? 'bg-red-600' :
                          fraudCheck.data.riskLevel === 'high' ? 'bg-orange-500' :
                          fraudCheck.data.riskLevel === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <Badge className={
                          fraudCheck.data.riskLevel === 'critical' ? 'bg-red-600' :
                          fraudCheck.data.riskLevel === 'high' ? 'bg-orange-500' :
                          fraudCheck.data.riskLevel === 'medium' ? 'bg-yellow-500' :
                          'bg-green-600'
                        }>
                          {fraudCheck.data.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Flags */}
                    {fraudCheck.data.hasFraudFlags ? (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-red-900 mb-2">Fraud Flags Found:</p>
                        <div className="space-y-1">
                          {fraudCheck.data.flags.map((flag: any, i: number) => (
                            <div key={i} className="text-sm text-red-800">
                              <span className="font-medium">{flag.flagType}</span>
                              {flag.description && ` - ${flag.description}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-800">No fraud flags detected</span>
                      </div>
                    )}

                    {/* Related Identities */}
                    {fraudCheck.data.relatedIdentities?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Related Identities:</p>
                        <div className="space-y-1">
                          {fraudCheck.data.relatedIdentities.map((relatedDid: string) => (
                            <div key={relatedDid} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                              <span className="font-mono truncate flex-1">{relatedDid}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setSelectedDID(relatedDid)}
                              >
                                →
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {fraudCheck.error && (
                  <div className="text-sm text-red-600">Failed to load fraud data. Invalid DID?</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* API Documentation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">API Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-mono font-bold text-primary">POST /api/verifications/batch</p>
                <p className="text-muted-foreground mt-1">Verify multiple DIDs and detect fraud patterns. Returns verification status for all submitted DIDs.</p>
              </div>
              <div>
                <p className="font-mono font-bold text-primary">GET /api/fraud/check/:did</p>
                <p className="text-muted-foreground mt-1">Check if a DID has fraud flags. Returns risk level and related identities.</p>
              </div>
              <div>
                <p className="font-mono font-bold text-primary">POST /api/fraud/report</p>
                <p className="text-muted-foreground mt-1">Report a fraudulent identity. Used by institutions to flag suspicious DIDs.</p>
              </div>
              <div>
                <p className="font-mono font-bold text-primary">GET /api/identities/:did/verifications</p>
                <p className="text-muted-foreground mt-1">Get verification history for a DID. Shows all institutions that verified it.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
