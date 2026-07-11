import { doc, runTransaction, increment } from "firebase/firestore";

/**
 * Atomically increments the daily token counter for a given module
 * and returns the new token number (1-based).
 *
 * Firestore path: dailyCounters/{dateStr}
 * Doc shape:     { food: N, otherItems: N, ... }
 *
 * @param {import("firebase/firestore").Firestore} db
 * @param {string} dateStr  - "YYYY-MM-DD"
 * @param {string} moduleKey - e.g. "food" | "otherItems"
 * @returns {Promise<number>} token number (starts at 1 each day)
 */
export async function getNextToken(db, dateStr, moduleKey) {
  const counterRef = doc(db, "dailyCounters", dateStr);
  const newCount = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data()[moduleKey] ?? 0) : 0;
    const next = current + 1;
    if (snap.exists()) {
      tx.update(counterRef, { [moduleKey]: next });
    } else {
      tx.set(counterRef, { [moduleKey]: next });
    }
    return next;
  });
  return newCount;
}
