import { useState, useEffect, useCallback } from "react";

/**
 * Actively probes connectivity every INTERVAL_MS and also on visibility change.
 * Falls back to navigator.onLine as the initial value.
 *
 * Uses a no-cors fetch to a known-stable URL (Google connectivity endpoint)
 * with a 4-second timeout. If the fetch succeeds (any opaque response) → online.
 * If it throws (NetworkError / abort) → offline.
 */

const PROBE_URL     = "https://www.gstatic.com/generate_204";
const INTERVAL_MS   = 10_000;  // probe every 10 s
const TIMEOUT_MS    = 4_000;

async function probeConnectivity() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(PROBE_URL, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;   // opaque success = online
  } catch {
    return false;  // NetworkError or abort = offline
  } finally {
    clearTimeout(timer);
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const checkAndSet = useCallback(async () => {
    // Fast path: browser already knows we're offline
    if (!navigator.onLine) { setIsOnline(false); return; }
    // Verify with an actual request
    const result = await probeConnectivity();
    setIsOnline(result);
  }, []);

  useEffect(() => {
    // Browser events (fire quickly on most platforms)
    function handleOnline()  { checkAndSet(); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);

    // Active probe at regular interval
    const interval = setInterval(checkAndSet, INTERVAL_MS);

    // Re-probe when user switches back to the tab
    function handleVisibility() {
      if (document.visibilityState === "visible") checkAndSet();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    // Initial probe on mount
    checkAndSet();

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [checkAndSet]);

  return isOnline;
}
