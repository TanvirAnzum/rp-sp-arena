import { useState } from "react";
import {
  downloadTurfBookings,
  downloadSwimmingTokens,
  downloadFoodSales,
  downloadOtherSales,
  downloadStaffList,
  downloadDashboard,
} from "./exportUtils";
import styles from "./DownloadsPage.module.css";

const thisYear = new Date().getFullYear();
const lastYear = thisYear - 1;

function yearRange(yr) {
  return { from: new Date(yr, 0, 1, 0, 0, 0), to: new Date(yr, 11, 31, 23, 59, 59) };
}
function monthRange() {
  const n = new Date();
  return {
    from: new Date(n.getFullYear(), n.getMonth(), 1, 0, 0, 0),
    to:   new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59),
  };
}
function todayStr() {
  // Use local date — toISOString() returns UTC which is wrong in BD (UTC+6)
  const n = new Date();
  return [
    n.getFullYear(),
    String(n.getMonth() + 1).padStart(2, "0"),
    String(n.getDate()).padStart(2, "0"),
  ].join("-");
}
function todayRange() {
  const n = new Date();
  return {
    from: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0),
    to:   new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59),
  };
}

const PRESETS = [
  { key: "all",       label: "All Time" },
  { key: "today",     label: "Today" },
  { key: "thisMonth", label: "This Month" },
  { key: "thisYear",  label: `This Year (${thisYear})` },
  { key: "lastYear",  label: `Last Year (${lastYear})` },
  { key: "custom",    label: "Custom Range" },
];

export default function DownloadsPage() {
  const [preset,     setPreset]     = useState("thisMonth");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState(todayStr());
  const [loading,    setLoading]    = useState({});

  function setLoad(key, val) {
    setLoading((prev) => ({ ...prev, [key]: val }));
  }

  async function run(key, fn) {
    setLoad(key, true);
    try { await fn(); }
    catch (err) { alert("Export failed: " + (err.message ?? err)); }
    finally { setLoad(key, false); }
  }

  /** Returns { from, to } or null. Individual exports get null for "All Time" (no filter). */
  function getRange(requireDates = false) {
    if (preset === "today") return todayRange();
    if (preset === "all") {
      // Dashboard needs real dates — use a far-past floor
      return requireDates
        ? { from: new Date(2020, 0, 1, 0, 0, 0), to: new Date() }
        : { from: null, to: null };
    }
    if (preset === "thisMonth") return monthRange();
    if (preset === "thisYear")  return yearRange(thisYear);
    if (preset === "lastYear")  return yearRange(lastYear);
    // custom
    if (!customFrom) { alert("Please select a start date."); return null; }
    return {
      from: new Date(customFrom + "T00:00:00"),
      to:   new Date(customTo   + "T23:59:59"),
    };
  }

  const activeLabel = PRESETS.find(p => p.key === preset)?.label ?? "";

  const sections = [
    {
      key:   "turf",
      icon:  "⚽",
      title: "Turf Bookings",
      desc:  "Customer name, slot, tier, price, advance, status",
      fn:    (from, to) => downloadTurfBookings(from, to),
      file:  "turf_bookings.xlsx",
    },
    {
      key:   "swimming",
      icon:  "🏊",
      title: "Swimming Tokens",
      desc:  "People, hours, rate, discount, VAT, total",
      fn:    (from, to) => downloadSwimmingTokens(from, to),
      file:  "swimming_tokens.xlsx",
    },
    {
      key:   "food",
      icon:  "🍔",
      title: "Food Sales",
      desc:  "Items, subtotal, discount, VAT, total",
      fn:    (from, to) => downloadFoodSales(from, to),
      file:  "food_sales.xlsx",
    },
    {
      key:   "other",
      icon:  "🛍️",
      title: "Other Items Sales",
      desc:  "Items, subtotal, discount, VAT, total",
      fn:    (from, to) => downloadOtherSales(from, to),
      file:  "other_items_sales.xlsx",
    },
    {
      key:      "staff",
      icon:     "👥",
      title:    "Staff List",
      desc:     "All registered staff — name, email, registered date",
      fn:       () => downloadStaffList(),
      file:     "staff_list.xlsx",
      noFilter: true,
    },
    {
      key:      "dashboard",
      icon:     "📊",
      title:    "Dashboard Summary",
      desc:     "Revenue, collected & due across all categories — Summary + Daily Breakdown sheets",
      fn:       (from, to) => downloadDashboard(from, to),
      file:     "dashboard_[range].xlsx",
      isDash:   true,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>📥 Downloads</h2>
        <p className={styles.subtitle}>Export all data as Excel (.xlsx) files</p>
      </div>

      {/* ── Quota warning ── */}
      <div className={styles.quotaNote}>
        <span className={styles.quotaIcon}>⚠️</span>
        <div className={styles.quotaText}>
          <strong>Firebase free tier notice</strong> — Each download reads every matching
          document from the database. "All Time" exports consume the most quota (50,000 reads/day
          on the free Spark plan). Use a specific date range to keep reads low,
          especially if exporting frequently.
        </div>
      </div>

      {/* ── Shared date filter ── */}
      <div className={styles.filterCard}>
        <div className={styles.filterLabel}>📅 Date range — applies to all exports below</div>
        <div className={styles.rangeRow}>
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.presetBtn} ${preset === key ? styles.presetActive : ""}`}
              onClick={() => setPreset(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className={styles.customRange}>
            <label>
              From
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className={styles.dateInput}
              />
            </label>
            <span className={styles.rangeSep}>→</span>
            <label>
              To
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={todayStr()}
                onChange={(e) => setCustomTo(e.target.value)}
                className={styles.dateInput}
              />
            </label>
          </div>
        )}
      </div>

      {/* ── All export cards ── */}
      <div className={styles.grid}>
        {sections.map((s) => {
          function handleClick() {
            if (s.noFilter) {
              run(s.key, s.fn);
              return;
            }
            const range = getRange(s.isDash);
            if (!range) return;
            run(s.key, () => s.fn(range.from, range.to));
          }

          return (
            <div
              key={s.key}
              className={`${styles.card} ${s.isDash ? styles.dashCard : ""}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>{s.icon}</span>
                <div>
                  <div className={styles.cardTitle}>{s.title}</div>
                  <div className={styles.cardFile}>{s.file}</div>
                </div>
              </div>
              <p className={styles.cardDesc}>{s.desc}</p>
              {!s.noFilter && (
                <p className={styles.filterHint}>
                  Range: <strong>{activeLabel}</strong>
                </p>
              )}
              <button
                className={styles.dlBtn}
                onClick={handleClick}
                disabled={!!loading[s.key]}
              >
                {loading[s.key]
                  ? <span className={styles.spinner}>⏳</span>
                  : s.icon + " Download"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
