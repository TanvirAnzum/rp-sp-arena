import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

function tsToTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * One-shot fetch for a given date, only runs when enabled=true.
 * Setting enabled=false (e.g. on date change) clears data immediately.
 */
export function useDayRevenue(dateStr, enabled) {
  const [data, setData]       = useState(null);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dateStr || !enabled) {
      setData(null);
      setRecords(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setData(null);
    setRecords(null);

    async function run() {
      try {
        const [turfSnap, swimSnap, foodSnap, otherSnap] = await Promise.all([
          getDocs(query(collection(db, "turfBookings"),   where("date", "==", dateStr))),
          getDocs(query(collection(db, "swimmingTokens"), where("date", "==", dateStr))),
          getDocs(query(collection(db, "foodSales"),      where("date", "==", dateStr))),
          getDocs(query(collection(db, "otherSales"),     where("date", "==", dateStr))),
        ]);

        if (cancelled) return;

        const turfDocs  = turfSnap.docs.filter(d => d.data().status === "booked");
        const swimDocs  = swimSnap.docs;
        const foodDocs  = foodSnap.docs;
        const otherDocs = otherSnap.docs;

        const turf     = turfDocs .reduce((s, d) => s + (d.data().finalTotal ?? d.data().price     ?? 0), 0);
        const swimming = swimDocs .reduce((s, d) => s + (d.data().finalTotal ?? d.data().totalPrice ?? 0), 0);
        const food     = foodDocs .reduce((s, d) => s + (d.data().total      ?? 0), 0);
        const other    = otherDocs.reduce((s, d) => s + (d.data().total      ?? 0), 0);
        const total    = turf + swimming + food + other;

        const turfPaid  = turfDocs .reduce((s, d) => s + (d.data().advancePaid ?? 0), 0);
        const swimPaid  = swimDocs .filter(d => d.data().paid).reduce((s, d) => s + (d.data().finalTotal ?? d.data().totalPrice ?? 0), 0);
        const foodPaid  = foodDocs .filter(d => d.data().paid).reduce((s, d) => s + (d.data().total      ?? 0), 0);
        const otherPaid = otherDocs.filter(d => d.data().paid).reduce((s, d) => s + (d.data().total      ?? 0), 0);
        const paidTotal = turfPaid + swimPaid + foodPaid + otherPaid;

        setData({
          turf, swimming, food, other, total,
          paidTotal,
          unpaidTotal: total - paidTotal,
          turfCount:  turfDocs.length,
          swimCount:  swimDocs.length,
          foodCount:  foodDocs.length,
          otherCount: otherDocs.length,
        });

        setRecords({
          turf: turfDocs.map(d => ({ id: d.id, ...d.data() })),
          swim: swimDocs.map(d => {
            const r = { id: d.id, ...d.data() };
            r._entryStr = tsToTime(r.entryTime);
            r._exitStr  = tsToTime(r.exitTime);
            return r;
          }),
          food:  foodDocs.map(d => ({ id: d.id, ...d.data() })),
          other: otherDocs.map(d => ({ id: d.id, ...d.data() })),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [dateStr, enabled]);

  return { data, records, loading };
}
