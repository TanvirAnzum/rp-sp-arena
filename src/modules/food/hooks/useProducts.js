import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";

/**
 * One-time fetch of a product catalog collection on mount.
 * Products rarely change so onSnapshot is wasteful on free tier.
 * Call refresh() manually after the owner adds/edits a product.
 *
 * @param {string} col - "foodProducts" | "otherProducts"
 */
export function useProducts(col) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, col), orderBy("name", "asc"));
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } finally {
      setLoading(false);
    }
  }, [col]);

  useEffect(() => { fetch(); }, [fetch]);

  return { products, loading, refresh: fetch };
}
