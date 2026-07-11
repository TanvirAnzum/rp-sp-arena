import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import styles from "./HomePage.module.css";

function toDateStr(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Prebooked: show if session has started AND (still within window OR unpaid).
 *   - In-window paid/unpaid  → show (pool is occupied)
 *   - Post-window unpaid     → show (collect payment)
 *   - Post-window paid       → hide (done)
 *   - Pre-window             → hide (not started yet)
 * Legacy: show until exitTime is manually set.
 */
function isTokenActive(token, nowMs) {
  if (token.prebooked && token.exitTime) {
    const entryMs = (token.entryTime?.toDate?.() ?? new Date(token.entryTime)).getTime();
    const exitMs  = (token.exitTime?.toDate?.()  ?? new Date(token.exitTime)).getTime();
    return nowMs >= entryMs && (nowMs <= exitMs || !token.paid);
  }
  return !token.exitTime && token.hours == null;
}

/** Display for active session: remaining time (prebooked) or elapsed (legacy) */
function sessionTimeDisplay(token, nowMs) {
  if (token.prebooked && token.exitTime) {
    const exitMs = (token.exitTime?.toDate?.() ?? new Date(token.exitTime)).getTime();
    if (nowMs > exitMs) return "⚠ Collect payment";
    const mins = Math.max(0, Math.floor((exitMs - nowMs) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  }
  // Legacy: elapsed
  if (!token.entryTime) return "—";
  const start = (token.entryTime?.toDate?.() ?? new Date(token.entryTime)).getTime();
  const mins = Math.max(0, Math.round((nowMs - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function HomePage() {
  const today = toDateStr(new Date());

  const [allSwimTokens, setAllSwimTokens] = useState([]);
  const [turfBookings,  setTurfBookings]  = useState([]);
  const [nowMs, setNowMs] = useState(Date.now());

  // Refresh every minute so timers update
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // All today's swimming tokens (filter on render so time changes work)
  useEffect(() => {
    const q = query(collection(db, "swimmingTokens"), where("date", "==", today));
    return onSnapshot(q, (snap) => {
      setAllSwimTokens(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [today]);

  // Turf bookings today
  useEffect(() => {
    const q = query(collection(db, "turfBookings"), where("date", "==", today));
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTurfBookings(all.filter((b) => b.status === "booked"));
    });
  }, [today]);

  // Filter active sessions at render time so minute-tick updates the count
  const activeSessions = allSwimTokens.filter((t) => isTokenActive(t, nowMs));
  const swimCount = activeSessions.length;
  const turfCount = turfBookings.length;

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Today's Overview</h2>
      <p className={styles.dateLabel}>
        {new Date().toLocaleDateString("en-BD", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        })}
      </p>

      <div className={styles.summaryRow}>
        {/* Swimming card */}
        <div className={`${styles.summaryCard} ${swimCount > 0 ? styles.cardActive : styles.cardIdle}`}>
          <div className={styles.cardIcon}>🏊</div>
          <div className={styles.cardCount}>{swimCount}</div>
          <div className={styles.cardLabel}>Active Swimming Session{swimCount !== 1 ? "s" : ""}</div>
        </div>

        {/* Turf card */}
        <div className={`${styles.summaryCard} ${turfCount > 0 ? styles.cardBooked : styles.cardIdle}`}>
          <div className={styles.cardIcon}>⚽</div>
          <div className={styles.cardCount}>{turfCount}</div>
          <div className={styles.cardLabel}>Turf Slot{turfCount !== 1 ? "s" : ""} Booked Today</div>
        </div>
      </div>

      {/* Active swimming sessions list */}
      {swimCount > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <span className={styles.liveDot}>●</span> Active Swimming Sessions
          </h3>
          <div className={styles.sessionGrid}>
            {activeSessions.map((token) => (
              <div key={token.id} className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <span className={styles.tokenNum}>
                    {token.tokenNumber != null
                      ? "#" + String(token.tokenNumber).padStart(3, "0")
                      : token.id.slice(0, 6)}
                  </span>
                  <span className={styles.sessionDuration}>
                    {sessionTimeDisplay(token, nowMs)}
                  </span>
                </div>
                <div className={styles.sessionDetails}>
                  <span>👥 {token.people} person{token.people !== 1 ? "s" : ""}</span>
                  <span>In: {formatTime(token.entryTime)}</span>
                  {token.exitTime && (
                    <span>Out: {formatTime(token.exitTime)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {swimCount === 0 && (
        <p className={styles.emptyNote}>No active swimming sessions right now.</p>
      )}

      {/* Turf bookings list */}
      {turfCount > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>⚽ Turf Bookings Today</h3>
          <div className={styles.turfList}>
            {turfBookings.map((b) => (
              <div key={b.id} className={styles.turfRow}>
                <span className={styles.turfSlot}>{b.slotLabel ?? "—"}</span>
                <span className={styles.turfCustomer}>{b.customerName}</span>
                <span className={styles.turfPhone}>{b.phone}</span>
                <span className={styles.turfTier}>{b.tier} players</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {turfCount === 0 && (
        <p className={styles.emptyNote}>No turf bookings for today.</p>
      )}
    </div>
  );
}
