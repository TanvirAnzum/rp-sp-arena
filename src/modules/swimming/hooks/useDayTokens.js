import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Subscribes to all swimming tokens for a given date (YYYY-MM-DD).
 * Ordered newest first.
 */
export function useDayTokens(dateStr) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateStr) return;
    setLoading(true);
    const q = query(
      collection(db, "swimmingTokens"),
      where("date", "==", dateStr),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTokens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [dateStr]);

  return { tokens, loading };
}
