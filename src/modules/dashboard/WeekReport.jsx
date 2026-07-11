import { useState } from "react";
import { useWeekRevenue } from "./hooks/useWeekRevenue";
import styles from "./WeekReport.module.css";

function getMondayStr(offset = 0) {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day) + offset * 7;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function weekLabel(mondayStr) {
  const mon = new Date(mondayStr + "T00:00:00");
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}, ${sun.getFullYear()}`;
}

const MODULES = [
  { key: "turf",  label: "Turf Booking", color: "#0ea5e9" },
  { key: "swim",  label: "Swimming",     color: "#8b5cf6" },
  { key: "food",  label: "Food Sales",   color: "#22c55e" },
  { key: "other", label: "Other Items",  color: "#f59e0b" },
];

export default function WeekReport() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [enabled, setEnabled]       = useState(false);
  const mondayStr = getMondayStr(weekOffset);
  const { data, loading } = useWeekRevenue(mondayStr, enabled);

  function changeWeek(delta) {
    setWeekOffset((o) => o + delta);
    setEnabled(false);
  }

  const showData = enabled && !loading && data?.mondayStr === mondayStr;

  return (
    <div className={styles.container}>
      {/* Week navigation */}
      <div className={styles.weekNav}>
        <button className={styles.navBtn} onClick={() => changeWeek(-1)}>‹</button>
        <span className={styles.weekLabel}>{weekLabel(mondayStr)}</span>
        <button
          className={styles.navBtn}
          onClick={() => changeWeek(1)}
          disabled={weekOffset >= 0}
        >›</button>
        <button
          className={styles.loadBtn}
          onClick={() => setEnabled(true)}
          disabled={loading || enabled}
        >
          {loading ? "Loading…" : enabled ? "Loaded" : "Load Report"}
        </button>
      </div>

      {!enabled && !loading && (
        <p className={styles.hint}>Click "Load Report" to fetch this week's data.</p>
      )}

      {showData && (
        <>
          {/* Module cards */}
          <div className={styles.cards}>
            {MODULES.map(({ key, label, color }) => (
              <div key={key} className={styles.card} style={{ borderTopColor: color }}>
                <div className={styles.cardLabel}>{label}</div>
                <div className={styles.cardAmt} style={{ color }}>
                  ৳{(data[key]?.total ?? 0).toLocaleString()}
                </div>
                <div className={styles.cardCount}>
                  {data[key]?.count ?? 0} records
                </div>
              </div>
            ))}
          </div>

          {/* Revenue summary */}
          <div className={styles.summaryBar}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Week Revenue</span>
              <span className={styles.summaryAmt}>৳{data.revenue.toLocaleString()}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Collected</span>
              <span className={styles.paidAmt}>৳{data.collected.toLocaleString()}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Outstanding</span>
              <span className={styles.dueAmt}>৳{data.outstanding.toLocaleString()}</span>
            </div>
          </div>

          {/* Expenses + Net */}
          <div className={styles.expenseBar}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Expenses</span>
              <span className={styles.expAmt}>− ৳{data.exp.total.toLocaleString()}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Net (Revenue − Expenses)</span>
              <span className={data.net >= 0 ? styles.netPos : styles.netNeg}>
                ৳{data.net.toLocaleString()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
