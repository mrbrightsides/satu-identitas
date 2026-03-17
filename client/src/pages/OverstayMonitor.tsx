import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Globe, ShieldAlert, Activity, RefreshCw } from "lucide-react";
import type { OverstayEvent, VisaIdentity } from "@shared/schema";
import { Link } from "wouter";

function formatTimestamp(ts: string | Date | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts as string);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
}

function timeAgo(ts: string | Date | null | undefined): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts as string).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function OverstayMonitor() {
  const { data: events = [], isLoading: eventsLoading, dataUpdatedAt, refetch } = useQuery<OverstayEvent[]>({
    queryKey: ["/api/overstay-events"],
    refetchInterval: 30000,
  });

  const { data: flagged = [], isLoading: flaggedLoading } = useQuery<VisaIdentity[]>({
    queryKey: ["/api/visa-identities/flagged"],
    refetchInterval: 30000,
  });

  const { data: allVisa = [] } = useQuery<VisaIdentity[]>({
    queryKey: ["/api/visa-identities"],
    refetchInterval: 30000,
  });

  const activeVisa = allVisa.filter(v => v.status !== "flagged");
  const lastCheck = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="text-red-500 h-8 w-8" />
              Overstay Monitor
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Real-time immigration compliance — auto-refresh every 30s
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3 animate-pulse text-green-500" />
            <span>Live · Last check: {lastCheck}</span>
            <button
              onClick={() => refetch()}
              className="ml-2 rounded-full p-1 hover:bg-muted transition-colors"
              title="Refresh now"
              data-testid="button-refresh-monitor"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-3xl font-bold text-red-500" data-testid="stat-flagged-count">
                    {flaggedLoading ? "—" : flagged.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Flagged (Overstay)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-3xl font-bold text-green-500" data-testid="stat-active-count">
                    {activeVisa.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Visitors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-3xl font-bold text-yellow-500" data-testid="stat-events-count">
                    {eventsLoading ? "—" : events.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Overstay Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Visitors Table */}
        {flagged.length > 0 && (
          <Card className="border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Flagged Visitors ({flagged.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flagged.map(v => (
                  <div
                    key={v.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 gap-2"
                    data-testid={`row-flagged-${v.id}`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" data-testid={`text-name-${v.id}`}>{v.fullName}</span>
                        <Badge variant="secondary" className="text-xs capitalize">{v.visaType}</Badge>
                        <Badge className="bg-red-600 text-white text-xs">OVERSTAY</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{v.did}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.nationality} · Passport {v.passportNumber} · Expired {formatTimestamp(v.visaExpiry)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-red-400 font-medium">
                        Flagged {timeAgo(v.flaggedAt)}
                      </p>
                      <Link href={`/did/${encodeURIComponent(v.did)}`}>
                        <span className="text-xs text-primary hover:underline cursor-pointer" data-testid={`link-detail-${v.id}`}>
                          View DID →
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Log */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Event Log
              <Badge variant="outline" className="ml-auto text-xs font-mono">JSON</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No overstay events detected yet.</p>
                <p className="text-xs mt-1">Monitor checks for expired visas every 30 seconds.</p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="event-log-list">
                {events.map(ev => {
                  const meta = ev.metadata as Record<string, string> | null;
                  const jsonPayload = {
                    event: ev.event,
                    did: ev.did,
                    timestamp: new Date(ev.timestamp as string).toISOString(),
                    status: ev.status,
                  };
                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-red-500/20 bg-[#0d1117] overflow-hidden"
                      data-testid={`event-card-${ev.id}`}
                    >
                      {/* Event header */}
                      <div className="flex items-center justify-between px-4 py-2 bg-red-950/40 border-b border-red-500/20">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs font-mono font-bold text-red-400">{ev.event}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{timeAgo(ev.timestamp)}</span>
                      </div>

                      {/* JSON block */}
                      <pre className="text-xs text-green-400 font-mono px-4 py-3 overflow-x-auto leading-relaxed">
{JSON.stringify(jsonPayload, null, 2)}
                      </pre>

                      {/* Metadata footer */}
                      {meta && (
                        <div className="px-4 py-2 border-t border-red-500/10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {meta.fullName && <span>👤 {meta.fullName}</span>}
                          {meta.nationality && <span>🌏 {meta.nationality}</span>}
                          {meta.visaType && <span>📋 {meta.visaType} visa</span>}
                          {meta.overstayDuration && (
                            <span className="text-red-400 font-medium">⏱ Overstay: {meta.overstayDuration}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
