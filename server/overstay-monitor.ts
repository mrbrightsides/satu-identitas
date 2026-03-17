import { storage } from "./storage";

const CHECK_INTERVAL_MS = 30 * 1000; // every 30 seconds

function calcOverstayDuration(visaExpiry: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - visaExpiry.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return `${days}d ${remainHours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

async function runOverstayCheck() {
  try {
    const expired = await storage.getExpiredVisas();
    if (expired.length === 0) return;

    console.log(`[overstay-monitor] Checking ${expired.length} expired visa(s)...`);

    for (const visa of expired) {
      const now = new Date();
      const overstayDuration = calcOverstayDuration(visa.visaExpiry);

      await storage.flagOverstay(visa.did);

      const event = await storage.createOverstayEvent(
        visa.did,
        "OVERSTAY_DETECTED",
        "flagged",
        {
          fullName: visa.fullName,
          nationality: visa.nationality ?? "Unknown",
          passportNumber: visa.passportNumber,
          visaType: visa.visaType,
          visaExpiry: visa.visaExpiry.toISOString(),
          overstayDuration,
          detectedAt: now.toISOString(),
        }
      );

      console.log(
        `[overstay-monitor] OVERSTAY_DETECTED — ${visa.fullName} (${visa.did}) — overstay: ${overstayDuration}`
      );
      console.log(
        JSON.stringify({
          event: "OVERSTAY_DETECTED",
          did: visa.did,
          timestamp: event.timestamp?.toISOString(),
          status: "flagged",
        })
      );
    }
  } catch (err) {
    console.error("[overstay-monitor] Error during check:", err);
  }
}

export function startOverstayMonitor() {
  console.log(`[overstay-monitor] Started — checking every ${CHECK_INTERVAL_MS / 1000}s`);
  runOverstayCheck();
  setInterval(runOverstayCheck, CHECK_INTERVAL_MS);
}
