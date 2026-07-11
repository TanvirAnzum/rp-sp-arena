import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useDayExpenses } from "../expenses/hooks/useDayExpenses";
import { printDaySummary } from "./printDaySummary";
import { useDayRevenue } from "./hooks/useDayRevenue";
import { toDateStr, formatDateLabel } from "../food/pos.utils";
import styles from "./DayReport.module.css";

const MODULES = [
  { key: "turf",     label: "Turf Booking", color: "#0ea5e9", countKey: "turfCount"  },
  { key: "swimming", label: "Swimming",     color: "#8b5cf6", countKey: "swimCount"  },
  { key: "food",     label: "Food Sales",   color: "#22c55e", countKey: "foodCount"  },
  { key: "other",    label: "Other Items",  color: "#f59e0b", countKey: "otherCount" },
];

export default function DayReport() {
  const { isOwner, displayName } = useAuth();
  const [date, setDate]       = useState(toDateStr(new Date()));
  const [enabled, setEnabled] = useState(false);

  const { data, records, loading } = useDayRevenue(date, enabled);
  const { expenses } = useDayExpenses(date, enabled);
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  function changeDate(delta) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(toDateStr(d));
    setEnabled(false);
  }

  function handleDateInput(val) {
    setDate(val);
    setEnabled(false);
  }

  function goToday() {
    setDate(toDateStr(new Date()));
    setEnabled(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.datePicker}>
        {isOwner ? (
          <>
            <button className={styles.navBtn} onClick={() => changeDate(-1)}>&lsaquo;</button>
            <div className={styles.dateDisplay}>
              <span className={styles.dateLabel}>{formatDateLabel(date)}</span>
              <input
                type="date"
                className={styles.dateInput}
                value={date}
                onChange={(e) => handleDateInput(e.target.value)}
              />
            </div>
            <button className={styles.navBtn} onClick={() => changeDate(1)}>&rsaquo;</button>
            <button className={styles.todayBtn} onClick={goToday}>Today</button>
          </>
        ) : (
          <span className={styles.dateLabel}>{formatDateLabel(date)}</span>
        )}
        <button
          className={styles.generateBtn}
          onClick={() => setEnabled(true)}
          disabled={loading || enabled}
        >
          {loading ? "Loading…" : enabled ? "Loaded ✓" : "Generate Report"}
        </button>
      </div>

      {!enabled && !loading && (
        <p className={styles.hint}>
          Select a date and click <strong>Generate Report</strong> to load figures.
        </p>
      )}

      {loading && <p className={styles.empty}>Loading…</p>}

      {enabled && !loading && data && (
        <>
          <div className={styles.cards}>
            {MODULES.map(({ key, label, color, countKey }) => (
              <div key={key} className={styles.card} style={{ borderTopColor: color }}>
                <div className={styles.cardLabel}>{label}</div>
                <div className={styles.cardAmount} style={{ color }}>
                  &#2547;{(data[key] ?? 0).toLocaleString()}
                </div>
                <div className={styles.cardCount}>
                  {data[countKey] ?? 0} record{data[countKey] !== 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.printRow}>
            <button
              className={styles.printBtn}
              onClick={() => printDaySummary({
                date,
                dateLabel: formatDateLabel(date),
                generatedBy: displayName || "Staff",
                data,
                records,
                expenses,
                expenseTotal,
              })}
            >
              Print Daily Summary
            </button>
          </div>

          <div className={styles.totalBar}>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Day Total</span>
              <span className={styles.totalAmt}>&#2547;{(data.total ?? 0).toLocaleString()}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Collected</span>
              <span className={styles.paidAmt}>&#2547;{(data.paidTotal ?? 0).toLocaleString()}</span>
            </div>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Outstanding</span>
              <span className={styles.unpaidAmt}>&#2547;{(data.unpaidTotal ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
