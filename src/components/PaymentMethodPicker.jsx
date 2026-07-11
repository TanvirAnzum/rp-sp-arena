import styles from "./PaymentMethodPicker.module.css";

export const METHOD_LABELS = {
  cash:   "Cash",
  card:   "Card",
  mfs:    "MFS (Mobile)",
  others: "Others",
};

const METHODS = [
  { key: "cash",   icon: "💵", label: "Cash" },
  { key: "card",   icon: "💳", label: "Card" },
  { key: "mfs",    icon: "📱", label: "MFS" },
  { key: "others", icon: "🔖", label: "Others" },
];

export default function PaymentMethodPicker({
  value,
  onChange,
  txId,
  onTxIdChange,
  note,
  onNoteChange,
  compact = false,
}) {
  const txIdPlaceholder =
    value === "mfs"  ? "e.g. bKash TxID 8A2X1F9K" :
    value === "card" ? "e.g. TXN123456" :
    "Reference / receipt no.";

  return (
    <div className={`${styles.picker} ${compact ? styles.compact : ""}`}>
      <div className={styles.pickerLabel}>Payment Method</div>
      <div className={styles.methods}>
        {METHODS.map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            className={`${styles.methodBtn} ${value === key ? styles.active : ""}`}
            onClick={() => onChange(key)}
          >
            <span className={styles.methodIcon}>{icon}</span>
            <span className={styles.methodLabel}>{label}</span>
          </button>
        ))}
      </div>
      <div className={styles.extraFields}>
        <div className={styles.extraField}>
          <label className={styles.extraLabel}>
            TxID / Reference
            <span className={styles.notOnBill}> — not printed on bill</span>
          </label>
          <input
            className={styles.extraInput}
            type="text"
            placeholder={txIdPlaceholder}
            value={txId}
            onChange={(e) => onTxIdChange(e.target.value)}
          />
        </div>
        <div className={styles.extraField}>
          <label className={styles.extraLabel}>
            Note
            <span className={styles.notOnBill}> — not printed on bill</span>
          </label>
          <input
            className={styles.extraInput}
            type="text"
            placeholder="Any remarks for internal use…"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
