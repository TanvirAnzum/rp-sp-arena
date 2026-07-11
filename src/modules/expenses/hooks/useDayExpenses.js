import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Real-time subscription to expenses for a given date.
 * Pass enabled=false (default) to defer the listener until needed.
 * Used by DayReport (gated) and ExpensesPage (always enabled).
 */
export function useDayExpenses(dateStr, enabled = true) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!dateStr || !enabled) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "expenses"),
      where("date", "==", dateStr),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [dateStr, enabled]);

  return { expenses, loading };
}
