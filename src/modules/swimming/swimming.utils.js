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
