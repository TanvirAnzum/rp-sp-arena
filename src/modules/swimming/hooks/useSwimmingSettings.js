import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * Subscribes to the single swimming config doc.
 * Returns { pricePerPersonPerHour, loading }.
 */
export function useSwimmingSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "swimmingSettings", "config"), (snap) => {
      setSettings(snap.exists() ? snap.data() : { pricePerPersonPerHour: 0 });
      setLoading(false);
    });
    return unsub;
  }, []);

  return { settings, loading };
}
