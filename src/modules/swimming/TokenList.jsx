import { useState } from "react";
import { useDayTokens } from "./hooks/useDayTokens";
import TokenCard from "./TokenCard";
import { toDateStr, formatDateLabel } from "./swimming.utils";
import styles from "./TokenList.module.css";

export default function TokenList({ refreshKey }) {
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const { tokens, loading } = useDayTokens(selectedDate);

  function changeDate(delta) {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateStr(d));
  }

  const totalRevenue = tokens.reduce((sum, t) => sum + (t.totalPrice ?? 0), 0);
  const paidRevenue  = tokens.filter((t) => t.paid).reduce((sum, t) => sum + (t.totalPrice ?? 0), 0);

  return (
    <div className={styles.container}>
      {/* Date navigation */}
      <div className={styles.datePicker}>
        <button className={styles.navBtn} onClick={() => changeDate(-1)}>‹</button>
        <div className={styles.dateDisplay}>
          <span className={styles.dateLabel}>{formatDateLabel(selectedDate)}</span>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <button className={styles.navBtn} onClick={() => changeDate(1)}>›</button>
      </div>

      {/* Summary bar */}
      {tokens.length > 0 && (
        <div className={styles.summaryBar}>
          <span>{tokens.length} token{tokens.length !== 1 ? "s" : ""}</span>
          <span>Total: <strong>৳{totalRevenue.toLocaleString()}</strong></span>
          <span>Collected: <strong className={styles.paid}>৳{paidRevenue.toLocaleString()}</strong></span>
          <span>Due: <strong className={styles.due}>৳{(totalRevenue - paidRevenue).toLocaleString()}</strong></span>
        </div>
      )}

      {/* Token cards */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : tokens.length === 0 ? (
        <p className={styles.empty}>No tokens issued for this date.</p>
      ) : (
        <div className={styles.grid}>
          {tokens.map((t) => (
            <TokenCard key={t.id} token={t} />
          ))}
        </div>
      )}
    </div>
  );
}
