import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Aggregates revenue for a full calendar month across all 4 modules.
 * @param {number} year  - e.g. 2026
 * @param {number} month - 1-based (1=Jan … 12=Dec)
 *
 * Returns { data, loading } where data = {
 *   turf, swimming, food, other, total,
 *   dailyMap: { "YYYY-MM-DD": { turf, swimming, food, other, total } },
 *   days: sorted array of date strings that have any activity,
 *   lastDay: last calendar day of the month,
 * }
 */
export function useMonthRevenue(year, month, enabled = false) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setData(null);

    const mm       = String(month).padStart(2, "0");
    const lastDay  = new Date(year, month, 0).getDate();
    const start    = `${year}-${mm}-01`;
    const end      = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;

    async function run() {
      try {
        const [turfSnap, swimSnap, foodSnap, otherSnap] = await Promise.all([
          getDocs(query(collection(db, "turfBookings"),   where("date", ">=", start), where("date", "<=", end))),
          getDocs(query(collection(db, "swimmingTokens"), where("date", ">=", start), where("date", "<=", end))),
          getDocs(query(collection(db, "foodSales"),      where("date", ">=", start), where("date", "<=", end))),
          getDocs(query(collection(db, "otherSales"),     where("date", ">=", start), where("date", "<=", end))),
        ]);

        if (cancelled) return;

        // Build a per-day map
        const dailyMap = {};

        function ensure(date) {
          if (!dailyMap[date]) dailyMap[date] = { turf: 0, swimming: 0, food: 0, other: 0, total: 0 };
        }

        turfSnap.docs.forEach(d => {
          if (d.data().status !== "booked") return;
          const date = d.data().date;
          ensure(date);
          dailyMap[date].turf += d.data().finalTotal ?? d.data().price ?? 0;
        });

        swimSnap.docs.forEach(d => {
          const date = d.data().date;
          ensure(date);
          dailyMap[date].swimming += d.data().finalTotal ?? d.data().totalPrice ?? 0;
        });

        foodSnap.docs.forEach(d => {
          const date = d.data().date;
          ensure(date);
          dailyMap[date].food += d.data().total ?? 0;
        });

        otherSnap.docs.forEach(d => {
          const date = d.data().date;
          ensure(date);
          dailyMap[date].other += d.data().total ?? 0;
        });

        // Compute daily totals
        Object.keys(dailyMap).forEach(date => {
          const d = dailyMap[date];
          d.total = d.turf + d.swimming + d.food + d.other;
        });

        const turf     = Object.values(dailyMap).reduce((s, d) => s + d.turf,     0);
        const swimming = Object.values(dailyMap).reduce((s, d) => s + d.swimming,  0);
        const food     = Object.values(dailyMap).reduce((s, d) => s + d.food,      0);
        const other    = Object.values(dailyMap).reduce((s, d) => s + d.other,     0);
        const total    = turf + swimming + food + other;

        setData({
          turf, swimming, food, other, total,
          dailyMap,
          days: Object.keys(dailyMap).sort(),
          lastDay,
          year, month,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [year, month, enabled]);

  return { data, loading };
}
