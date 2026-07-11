import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Real-time subscription to sales for a given date.
 * @param {string} col  - "foodSales" | "otherSales"
 * @param {string} date - YYYY-MM-DD
 */
export function useDaySales(col, date) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    const q = query(
      collection(db, col),
      where("date", "==", date),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setSales(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [col, date]);

  return { sales, loading };
}
