export function toDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatDateLabel(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Generate a short human-readable token ID from a Firestore doc ID */
export function shortTokenId(docId) {
  return "SW-" + docId.slice(0, 6).toUpperCase();
}

/** Format a Firestore Timestamp or JS Date to "h:MM AM/PM" */
export function formatEntryTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Format a Firestore Timestamp or JS Date to "h:MM AM/PM" — alias for exit time */
export const formatExitTime = formatEntryTime;

/**
 * Returns overtime in minutes if exitTime > entryTime + bookedHours, else 0.
 * @param {import("firebase/firestore").Timestamp|Date|null} entryTs
 * @param {import("firebase/firestore").Timestamp|Date|null} exitTs
 * @param {number} bookedHours
 */
export function getOvertimeMinutes(entryTs, exitTs, bookedHours) {
  if (!entryTs || !exitTs || !bookedHours) return 0;
  const entryMs = (entryTs.toDate ? entryTs.toDate() : new Date(entryTs)).getTime();
  const exitMs  = (exitTs.toDate  ? exitTs.toDate()  : new Date(exitTs)).getTime();
  const bookedMs = bookedHours * 60 * 60 * 1000;
  const overMs = exitMs - entryMs - bookedMs;
  return overMs > 0 ? Math.round(overMs / 60000) : 0;
}

/**
 * Calculate billed hours from entry to exit, rounded UP to nearest 30 min.
 * e.g. 1h 05min → 1.5 hrs,  2h 00min → 2 hrs,  0h 10min → 0.5 hrs
 */
export function calcBilledHours(entryTs, exitTs) {
  if (!entryTs || !exitTs) return 0;
  const entryMs = (entryTs.toDate ? entryTs.toDate() : new Date(entryTs)).getTime();
  const exitMs  = (exitTs.toDate  ? exitTs.toDate()  : new Date(exitTs)).getTime();
  const mins = (exitMs - entryMs) / 60000;
  if (mins <= 0) return 0;
  return Math.ceil(mins / 30) * 0.5;
}

/**
 * Format duration in minutes to a readable string: "1 hr 20 min"
 */
export function formatDuration(mins) {
  if (!mins || mins < 0) return "0 min";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}
