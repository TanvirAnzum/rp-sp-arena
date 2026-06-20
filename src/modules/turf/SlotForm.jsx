import { useState } from "react";
import { TIERS } from "./turf.utils";
import styles from "./SlotForm.module.css";

const DEFAULT_STATE = {
  startTime: "",
  endTime: "",
  isActive: true,
  prices: { "14": "", "16": "", "18": "" },
};

export default function SlotForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(
    initial
      ? {
          startTime: initial.startTime,
          endTime: initial.endTime,
          isActive: initial.isActive,
          prices: {
            "14": initial.prices?.["14"] ?? "",
            "16": initial.prices?.["16"] ?? "",
            "18": initial.prices?.["18"] ?? "",
          },
        }
      : DEFAULT_STATE
  );
  const [error, setError] = useState("");

  function setPrice(tier, val) {
    setForm((f) => ({ ...f, prices: { ...f.prices, [tier]: val } }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.startTime || !form.endTime) return setError("Start and end time are required.");
    if (form.startTime >= form.endTime) return setError("End time must be after start time.");
    const anyPrice = TIERS.some((t) => Number(form.prices[t]) > 0);
    if (!anyPrice) return setError("Set at least one tier price.");

    const cleaned = {
      startTime: form.startTime,
      endTime: form.endTime,
      isActive: form.isActive,
      prices: Object.fromEntries(
        TIERS.map((t) => [t, Number(form.prices[t]) || 0])
      ),
    };
    setError("");
    onSubmit(cleaned);
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Start Time</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            required
          />
        </div>
        <div className={styles.field}>
          <label>End Time</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            required
          />
        </div>
      </div>

      <fieldset className={styles.tierFieldset}>
        <legend>Price per Capacity Tier (৳)</legend>
        <div className={styles.tierRow}>
          {TIERS.map((t) => (
            <div key={t} className={styles.tierField}>
              <label>{t} players</label>
              <input
                type="number"
                min="0"
                placeholder="0 = N/A"
                value={form.prices[t]}
                onChange={(e) => setPrice(t, e.target.value)}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <label className={styles.checkLabel}>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
        />
        Active (visible in booking view)
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving…" : initial ? "Save Changes" : "Add Slot"}
        </button>
      </div>
    </form>
  );
}
