import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../auth/AuthContext";
import { useSwimmingSettings } from "./hooks/useSwimmingSettings";
import { toDateStr } from "./swimming.utils";
import styles from "./IssueTokenForm.module.css";

export default function IssueTokenForm({ onIssued }) {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSwimmingSettings();

  const [people, setPeople] = useState("");
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const price = settings?.pricePerPersonPerHour ?? 0;
  const total = price && people && hours ? Number(people) * Number(hours) * price : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!price) return setError("Swimming price is not set. Ask the owner to configure it first.");
    if (Number(people) < 1) return setError("At least 1 person required.");
    if (Number(hours) <= 0) return setError("Hours must be greater than 0.");
    setSaving(true);
    setError("");
    const now = new Date();
    try {
      const docRef = await addDoc(collection(db, "swimmingTokens"), {
        people: Number(people),
        hours: Number(hours),
        pricePerPersonPerHour: price,
        totalPrice: total,
        date: toDateStr(now),
        entryTime: serverTimestamp(),
        paid: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setPeople("");
      setHours("");
      onIssued?.(docRef.id);
    } catch {
      setError("Failed to issue token. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (settingsLoading) return null;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Issue New Token</h3>

      {!price && (
        <p className={styles.warning}>
          ⚠️ Swimming price not configured. The owner must set it under Settings.
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fields}>
          <div className={styles.field}>
            <label>Number of People</label>
            <input
              type="number"
              min="1"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="e.g. 3"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Hours</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 2"
              required
            />
          </div>
        </div>

        {total !== null && (
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>{people} people × {hours} hr × ৳{price.toLocaleString()}</span>
              <strong>৳{total.toLocaleString()}</strong>
            </div>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={saving || !price}>
          {saving ? "Issuing…" : "Issue Token"}
        </button>
      </form>
    </div>
  );
}
