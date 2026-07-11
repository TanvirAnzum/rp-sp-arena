import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Fetches revenue for a Monday–Sunday week.
 * Load-on-demand via `enabled` flag to protect free-tier quota.
 */
export function useWeekRevenue(mondayStr, enabled = false) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !mondayStr) return;

    let cancelled = false;
    setLoading(true);

    // Build Sunday date (mondayStr + 6 days)
    const mon = new Date(mondayStr + "T00:00:00");
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);

    async function run() {
      const { Timestamp } = await import("firebase/firestore");
      const tsFrom = Timestamp.fromDate(mon);
      const tsTo   = Timestamp.fromDate(sun);

      // Build date strings for date-field queries (turf + swimming use "date")
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(mon); d.setDate(mon.getDate() + i);
        // Use local date — toISOString() returns UTC which is wrong in BD (UTC+6)
        dates.push([
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, "0"),
          String(d.getDate()).padStart(2, "0"),
        ].join("-"));
      }

      // Turf: skip cancelled bookings; fall back to price when finalTotal not yet set
      async function sumTurf() {
        const q = query(collection(db, "turfBookings"), where("date", "in", dates));
        const snap = await getDocs(q);
        let total = 0, paid = 0, count = 0;
        snap.docs.forEach((d) => {
          if (d.data().status !== "booked") return;
          const v = d.data().finalTotal ?? d.data().price ?? 0;
          total += v; count++;
          if (d.data().paid) paid += v;
        });
        return { total, paid, count };
      }

      // Swimming: fall back to totalPrice when finalTotal not yet set (unpaid sessions)
      async function sumSwim() {
        const q = query(collection(db, "swimmingTokens"), where("date", "in", dates));
        const snap = await getDocs(q);
        let total = 0, paid = 0, count = 0;
        snap.docs.forEach((d) => {
          const v = d.data().finalTotal ?? d.data().totalPrice ?? 0;
          total += v; count++;
          if (d.data().paid) paid += v;
        });
        return { total, paid, count };
      }

      async function sumByTs(col, amtField) {
        const q = query(
          collection(db, col),
          where("createdAt", ">=", tsFrom),
          where("createdAt", "<=", tsTo),
          orderBy("createdAt")
        );
        const snap = await getDocs(q);
        let total = 0, paid = 0, count = 0;
        snap.docs.forEach((d) => {
          const v = d.data()[amtField] ?? 0;
          total += v; count++;
          if (d.data().paid) paid += v;
        });
        return { total, paid, count };
      }

      async function sumExpenses() {
        const q = query(collection(db, "expenses"), where("date", "in", dates));
        const snap = await getDocs(q);
        let total = 0, count = 0;
        snap.docs.forEach((d) => { total += d.data().amount ?? 0; count++; });
        return { total, count };
      }

      const [turf, swim, food, other, exp] = await Promise.all([
        sumTurf(),
        sumSwim(),
        sumByTs("foodSales",  "total"),
        sumByTs("otherSales", "total"),
        sumExpenses(),
      ]);

      if (cancelled) return;

      const revenue   = turf.total + swim.total + food.total + other.total;
      const collected = turf.paid  + swim.paid  + food.paid  + other.paid;

      setData({
        turf, swim, food, other, exp,
        revenue, collected,
        outstanding: revenue - collected,
        net: revenue - exp.total,
        mondayStr,
      });
      setLoading(false);
    }

    run().catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [mondayStr, enabled]);

  return { data, loading };
}
