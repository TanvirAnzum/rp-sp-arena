import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useSwimmingSettings } from "./hooks/useSwimmingSettings";
import styles from "./PriceSettings.module.css";

export default function PriceSettings() {
  const { settings, loading } = useSwimmingSettings();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit() {
    setValue(settings?.pricePerPersonPerHour ?? "");
    setEditing(true);
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    const price = Number(value);
    if (!price || price <= 0) return setError("Enter a valid price greater than 0.");
    setSaving(true);
    try {
      await setDoc(doc(db, "swimmingSettings", "config"), {
        pricePerPersonPerHour: price,
      }, { merge: true });
      setEditing(false);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.label}>Price per Person per Hour</span>
        {!editing && (
          <button className={styles.editBtn} onClick={startEdit}>
            {settings?.pricePerPersonPerHour ? "Edit" : "Set Price"}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.inputRow}>
            <span className={styles.currency}>৳</span>
            <input
              type="number"
              min="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 100"
              autoFocus
              className={styles.input}
            />
            <span className={styles.unit}>/ person / hour</span>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <p className={styles.currentPrice}>
          {settings?.pricePerPersonPerHour
            ? <>৳{settings.pricePerPersonPerHour.toLocaleString()} <span className={styles.unit}>/ person / hour</span></>
            : <span className={styles.notSet}>Not set — tap Edit to configure</span>}
        </p>
      )}
    </div>
  );
}
