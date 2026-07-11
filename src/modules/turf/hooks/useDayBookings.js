import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Real-time subscription to all bookings for a given date string (YYYY-MM-DD).
 * Returns a map of slotId → booking for O(1) lookup.
 */
export function useDayBookings(dateStr) {
  const [bookingsBySlot, setBookingsBySlot] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dateStr) return;
    setLoading(true);

    const q = query(
      collection(db, "turfBookings"),
      where("date", "==", dateStr),
      where("status", "in", ["booked", "held"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[data.slotId] = { id: d.id, ...data };
      });
      setBookingsBySlot(map);
      setLoading(false);
    });

    return unsub;
  }, [dateStr]);

  return { bookingsBySlot, loading };
}
