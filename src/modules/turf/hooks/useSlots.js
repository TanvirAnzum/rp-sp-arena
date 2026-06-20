import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Real-time subscription to all turf slots (active + inactive).
 * For the booking view, filter by isActive on the consuming side.
 */
export function useSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "turfSlots"), orderBy("startTime", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { slots, loading };
}
