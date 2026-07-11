import { useState } from "react";
import { useMonthRevenue } from "./hooks/useMonthRevenue";
import styles from "./MonthReport.module.css";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MODULES = [
  { key: "turf",     label: "Turf",     color: "#0ea5e9" },
  { key: "swimming", label: "Swimming", color: "#8b5cf6" },
  { key: "food",     label: "Food",     color: "#22c55e" },
  { key: "other",    label: "Other",    color: "#f59e0b" },
];

export default function MonthReport() {
  const now = new Date();
  const [year,    setYear]    = useState(now.getFullYear());
  const [month,   setMonth]   = useState(now.getMonth() + 1);
  const [enabled, setEnabled] = useState(false);

  const { data, loading } = useMonthRevenue(year, month, enabled);

  function prevMonth() {
    setEnabled(false);
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    setEnabled(false);
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Bar chart: max daily total for scaling
  const maxDaily = data
    ? Math.max(...Object.values(data.dailyMap).map(d => d.total), 1)
    : 1;

  // Build full calendar days for bar chart (even days with 0)
  const allDays = data
    ? Array.from({ length: data.lastDay }, (_, i) => {
        const dd   = String(i + 1).padStart(2, "0");
        const mm   = String(month).padStart(2, "0");
        const date = `${year}-${mm}-${dd}`;
        return { date, day: i + 1, ...(data.dailyMap[date] ?? { turf: 0, swimming: 0, food: 0, other: 0, total: 0 }) };
      })
    : [];

  return (
    <div className={styles.container}>
      {/* Month nav */}
      <div className={styles.monthNav}>
        <button className={styles.navBtn} onClick={prevMonth}>‹</button>
        <span className={styles.monthLabel}>{MONTH_NAMES[month - 1]} {year}</span>
        <button className={styles.navBtn} onClick={nextMonth}>›</button>
        <button
          className={styles.loadBtn}
          onClick={() => setEnabled(true)}
          disabled={loading || enabled}
        >
          {loading ? "Loading…" : enabled ? "Loaded ✓" : "Load Report"}
        </button>
      </div>

      {!enabled && !loading && (
        <p className={styles.hint}>
          Click <strong>Load Report</strong> to fetch data for {MONTH_NAMES[month - 1]} {year}.
          Each load reads all transactions for that month from the database.
        </p>
      )}

      {loading && <p className={styles.empty}>Fetching data…</p>}

      {enabled && !loading && data?.year === year && data?.month === month && (
        <>
          {/* Summary cards */}
          <div className={styles.cards}>
            {MODULES.map(({ key, label, color }) => (
              <div key={key} className={styles.card} style={{ borderTopColor: color }}>
                <div className={styles.cardLabel}>{label}</div>
                <div className={styles.cardAmount} style={{ color }}>
                  ৳{(data?.[key] ?? 0).toLocaleString()}
                </div>
              </div>
            ))}
            <div className={styles.card} style={{ borderTopColor: "#f1f5f9" }}>
              <div className={styles.cardLabel}>Month Total</div>
              <div className={styles.cardAmount} style={{ color: "#f1f5f9" }}>
                ৳{(data?.total ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          {allDays.length > 0 && (
            <div className={styles.chartSection}>
              <h3 className={styles.chartTitle}>Daily Revenue — {MONTH_NAMES[month - 1]} {year}</h3>
              <div className={styles.chartLegend}>
                {MODULES.map(({ key, label, color }) => (
                  <span key={key} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
              <div className={styles.chart}>
                {allDays.map(({ day, date, turf, swimming, food, other, total }) => {
                  const heightPct = (total / maxDaily) * 100;
                  return (
                    <div key={date} className={styles.barCol}>
                      <div className={styles.barWrap} title={`৳${total.toLocaleString()}`}>
                        <div className={styles.bar} style={{ height: `${heightPct}%` }}>
                          {[
                            { val: other,    color: "#f59e0b" },
                            { val: food,     color: "#22c55e" },
                            { val: swimming, color: "#8b5cf6" },
                            { val: turf,     color: "#0ea5e9" },
                          ].map(({ val, color }, i) => (
                            val > 0 ? (
                              <div
                                key={i}
                                className={styles.segment}
                                style={{ flex: val, background: color }}
                              />
                            ) : null
                          ))}
                        </div>
                      </div>
                      <div className={styles.barDay}>{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily table */}
          {data?.days.length > 0 ? (
            <div className={styles.tableSection}>
              <h3 className={styles.tableTitle}>Daily Breakdown</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Turf</th>
                      <th>Swimming</th>
                      <th>Food</th>
                      <th>Other</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.map(date => {
                      const d = data.dailyMap[date];
                      const label = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                        weekday: "short", day: "numeric", month: "short",
                      });
                      return (
                        <tr key={date}>
                          <td className={styles.dateCell}>{label}</td>
                          <td>{d.turf     > 0 ? `৳${d.turf.toLocaleString()}`     : "—"}</td>
                          <td>{d.swimming > 0 ? `৳${d.swimming.toLocaleString()}` : "—"}</td>
                          <td>{d.food     > 0 ? `৳${d.food.toLocaleString()}`     : "—"}</td>
                          <td>{d.other    > 0 ? `৳${d.other.toLocaleString()}`    : "—"}</td>
                          <td className={styles.totalCell}>৳{d.total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className={styles.footRow}>
                      <td>Total</td>
                      <td>৳{data.turf.toLocaleString()}</td>
                      <td>৳{data.swimming.toLocaleString()}</td>
                      <td>৳{data.food.toLocaleString()}</td>
                      <td>৳{data.other.toLocaleString()}</td>
                      <td>৳{data.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <p className={styles.empty}>No revenue recorded for this month.</p>
          )}
        </>
      )}
    </div>
  );
}
