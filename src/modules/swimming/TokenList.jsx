import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useDayTokens } from "./hooks/useDayTokens";
import TokenCard from "./TokenCard";
import SwimmingReceipt from "./SwimmingReceipt";
import Modal from "../../components/Modal";
import { toDateStr, formatDateLabel } from "./swimming.utils";
import { useDebouncedCallback } from "../../utils/useDebouncedCallback";
import styles from "./TokenList.module.css";

function isTokenActive(token, nowMs) {
  if (token.prebooked && token.exitTime) {
    const entryMs = (token.entryTime?.toDate?.() ?? new Date(token.entryTime)).getTime();
    const exitMs  = (token.exitTime?.toDate?.()  ?? new Date(token.exitTime)).getTime();
    return !token.paid && nowMs >= entryMs && nowMs <= exitMs;
  }
  return !token.exitTime && token.hours == null;
}

export default function TokenList() {
  const { isOwner } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [billToken,    setBillToken]    = useState(null);
  const [nowMs,        setNowMs]        = useState(Date.now());

  // Tick every minute so activeCount updates as sessions start/end
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const { tokens, loading } = useDayTokens(selectedDate);
  const today   = toDateStr(new Date());
  const isToday = selectedDate === today;

  const changeDate = useDebouncedCallback(
    useCallback((delta) => {
      if (delta < 0 && isToday && !isOwner) return;
      const d = new Date(selectedDate + "T00:00:00");
      d.setDate(d.getDate() + delta);
      setSelectedDate(toDateStr(d));
    }, [selectedDate, isToday, isOwner]),
    300,
  );

  const activeCount  = tokens.filter((t) => isTokenActive(t, nowMs)).length;
  const totalRevenue = tokens.reduce((sum, t) => sum + (t.finalTotal ?? t.totalPrice ?? 0), 0);
  const paidRevenue  = tokens.filter((t) => t.paid).reduce((sum, t) => sum + (t.finalTotal ?? t.totalPrice ?? 0), 0);

  return (
    <div className={styles.container}>
      {/* Date navigation */}
      <div className={styles.datePicker}>
        <button
          className={styles.navBtn}
          onClick={() => changeDate(-1)}
          disabled={!isOwner && isToday}
          title={!isOwner && isToday ? "Cannot go before today" : undefined}
        >‹</button>
        <div className={styles.dateDisplay}>
          <span className={styles.dateLabel}>{formatDateLabel(selectedDate)}</span>
          {isOwner && (
            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}
        </div>
        <button className={styles.navBtn} onClick={() => changeDate(1)}>›</button>
        {!isToday && (
          <button className={styles.todayBtn} onClick={() => setSelectedDate(today)}>Today</button>
        )}
        {isToday && activeCount > 0 && (
          <span className={styles.activeBadge}>● {activeCount} active</span>
        )}
      </div>

      {/* Summary bar */}
      {tokens.length > 0 && (
        <div className={styles.summaryBar}>
          <span>{tokens.length} token{tokens.length !== 1 ? "s" : ""}</span>
          {activeCount > 0 && (
            <span className={styles.activeCount}>
              <span className={styles.activeDot}>●</span> {activeCount} in session
            </span>
          )}
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
            <TokenCard
              key={t.id}
              token={t}
              onBill={setBillToken}
            />
          ))}
        </div>
      )}

      {/* Swimming bill modal */}
      {billToken && (
        <Modal
          title={`Swimming Bill — TOKEN ${billToken.tokenNumber != null ? "#" + String(billToken.tokenNumber).padStart(3, "0") : ""}`}
          onClose={() => setBillToken(null)}
          width="400px"
        >
          <SwimmingReceipt
            token={billToken}
            onClose={() => setBillToken(null)}
          />
        </Modal>
      )}
    </div>
  );
}
