import { useState, useEffect } from "react";
import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import {
  shortTokenId, formatEntryTime, formatExitTime,
  calcBilledHours, formatDuration,
} from "./swimming.utils";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../auth/AuthContext";
import styles from "./TokenCard.module.css";

function nowTimeStr() {
  const n = new Date();
  return n.toTimeString().slice(0, 5); // "HH:MM"
}

function toTimestamp(dateStr, timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return Timestamp.fromDate(d);
}

function exitTimestamp(dateStr, timeStr, entryTime) {
  const exitTs = toTimestamp(dateStr, timeStr);
  if (!entryTime) return exitTs;
  const entryMs = (entryTime.toDate ? entryTime.toDate() : new Date(entryTime)).getTime();
  if (exitTs.toDate().getTime() <= entryMs) {
    const next = new Date(exitTs.toDate().getTime() + 24 * 60 * 60 * 1000);
    return Timestamp.fromDate(next);
  }
  return exitTs;
}

export default function TokenCard({ token, onBill }) {
  const { isOwner } = useAuth();
  const [nowMs, setNowMs] = useState(Date.now());

  // ── Token style detection ────────────────────────────────────────────────
  // isPrebooked: token issued with new form (entryTime+exitTime+hours set at creation)
  const isPrebooked = !!token.prebooked;

  const entryDate = token.entryTime
    ? (token.entryTime?.toDate?.() ?? new Date(token.entryTime))
    : null;
  const exitDate = token.exitTime
    ? (token.exitTime?.toDate?.() ?? new Date(token.exitTime))
    : null;

  let isActive, isNotStarted, isSessionOver;
  if (isPrebooked) {
    const entryMs = entryDate?.getTime() ?? 0;
    const exitMs  = exitDate?.getTime()  ?? 0;
    isNotStarted  = !token.paid && nowMs < entryMs;
    isActive      = !token.paid && nowMs >= entryMs && nowMs <= exitMs;
    isSessionOver = !token.paid && exitMs > 0 && nowMs > exitMs;
  } else {
    // Legacy flow: active until exitTime is set
    isNotStarted  = false;
    isActive      = !token.exitTime && token.hours == null;
    isSessionOver = false;
  }

  // ── Live timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive && !isNotStarted) return;
    const id = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, [isActive, isNotStarted]);

  // ── Legacy: End-session inline form ──────────────────────────────────────
  const [showEnd,  setShowEnd]  = useState(false);
  const [exitTime, setExitTime] = useState(nowTimeStr());
  const [ending,   setEnding]   = useState(false);
  const [endError, setEndError] = useState("");

  // ── Entry time edit ──────────────────────────────────────────────────────
  const [editingEntry, setEditingEntry] = useState(false);
  const [entryInput,   setEntryInput]   = useState("");

  // ── Confirm dialog ───────────────────────────────────────────────────────
  const [confirmDlg, setConfirmDlg] = useState(null);

  // ── Paid toggle ──────────────────────────────────────────────────────────
  function handleTogglePaid() {
    // Prebooked unpaid: redirect to bill/receipt instead of direct toggle
    if (isPrebooked && !token.paid) { onBill?.(token); return; }
    // Legacy active sessions cannot be marked paid until session is ended
    if (!isPrebooked && isActive) return;
    // Staff cannot reverse a payment
    if (token.paid && !isOwner) return;
    setConfirmDlg({
      title:   token.paid ? "Mark as Unpaid?" : "Mark as Paid?",
      message: token.paid
        ? "This will remove the paid status from this session."
        : "Confirm that payment has been collected for this session.",
      variant:      token.paid ? "danger" : "primary",
      confirmLabel: token.paid ? "Mark Unpaid" : "Mark Paid",
      onConfirm: async () => {
        await updateDoc(doc(db, "swimmingTokens", token.id), { paid: !token.paid });
      },
    });
  }

  // ── Void token (owner only) ───────────────────────────────────────────────
  function handleVoid() {
    setConfirmDlg({
      title:   "Void Token?",
      message: "This will permanently delete this token. Use only for tokens issued by mistake.",
      variant:      "danger",
      confirmLabel: "Void Token",
      onConfirm: async () => {
        await deleteDoc(doc(db, "swimmingTokens", token.id));
      },
    });
  }

  // ── Save edited entry time ────────────────────────────────────────────────
  async function saveEntryTime() {
    if (!entryInput) return;
    const ts = toTimestamp(token.date ?? new Date().toISOString().split("T")[0], entryInput);
    await updateDoc(doc(db, "swimmingTokens", token.id), { entryTime: ts });
    setEditingEntry(false);
  }

  // ── Legacy: Confirm end session ───────────────────────────────────────────
  async function confirmEnd() {
    if (!exitTime) return setEndError("Set an exit time.");
    setEnding(true);
    setEndError("");
    try {
      const exitTs = exitTimestamp(token.date ?? new Date().toISOString().split("T")[0], exitTime, token.entryTime);
      const billedHours = calcBilledHours(token.entryTime, exitTs);
      if (billedHours <= 0) {
        setEndError("Exit time must be after entry time.");
        setEnding(false);
        return;
      }
      const totalPrice = billedHours * token.people * (token.pricePerPersonPerHour ?? 0);
      await updateDoc(doc(db, "swimmingTokens", token.id), {
        exitTime: exitTs,
        hours:    billedHours,
        totalPrice,
      });
      setShowEnd(false);
      onBill?.({ ...token, exitTime: exitTs, hours: billedHours, totalPrice });
    } catch {
      setEndError("Failed to end session. Try again.");
    } finally {
      setEnding(false);
    }
  }

  // ── Legacy: Preview calculations in end form ──────────────────────────────
  function previewDuration() {
    if (!exitTime || !token.entryTime) return null;
    const exitTs = exitTimestamp(token.date ?? new Date().toISOString().split("T")[0], exitTime, token.entryTime);
    const h = calcBilledHours(token.entryTime, exitTs);
    if (h <= 0) return null;
    const entryMs   = (token.entryTime.toDate ? token.entryTime.toDate() : new Date(token.entryTime)).getTime();
    const actualMins = (exitTs.toDate().getTime() - entryMs) / 60000;
    return { billedHours: h, actualMins, total: h * token.people * (token.pricePerPersonPerHour ?? 0) };
  }

  // ── Timers ────────────────────────────────────────────────────────────────
  function legacyLiveMins() {
    if (!token.entryTime) return 0;
    const entryMs = (token.entryTime.toDate ? token.entryTime.toDate() : new Date(token.entryTime)).getTime();
    return Math.max(0, (nowMs - entryMs) / 60000);
  }

  function remainingDisplay() {
    if (!exitDate) return "";
    const mins = Math.max(0, Math.floor((exitDate.getTime() - nowMs) / 60000));
    return formatDuration(mins);
  }

  function startsInDisplay() {
    if (!entryDate) return "";
    const mins = Math.max(0, Math.floor((entryDate.getTime() - nowMs) / 60000));
    return formatDuration(mins);
  }

  const preview      = showEnd ? previewDuration() : null;
  const rate         = token.pricePerPersonPerHour ?? 0;
  const displayTotal = token.finalTotal ?? token.totalPrice;
  const legacyMins   = (!isPrebooked && isActive) ? legacyLiveMins() : 0;
  const isLongSession = !isPrebooked && isActive && legacyMins > 180;

  const showBillBtn = isPrebooked || (!isActive && token.hours != null);
  const canTogglePaidStyle = (!isPrebooked && isActive) || (token.paid && !isOwner);

  return (
    <div className={`${styles.card} ${token.paid ? styles.paid : styles.unpaid} ${isActive ? styles.active : isSessionOver ? styles.sessionOver : ""}`}>

      {/* ── Long session warning (legacy only) ── */}
      {isLongSession && (
        <div className={styles.longWarning}>
          ⚠️ Session running for {formatDuration(legacyMins)} — please check on the customer.
        </div>
      )}

      {/* ── Session over warning (prebooked, unpaid) ── */}
      {isSessionOver && (
        <div className={styles.sessionOverWarning}>
          ⚠ Session ended — please collect payment
        </div>
      )}

      {/* ── Top row ── */}
      <div className={styles.top}>
        <div className={styles.tokenId}>
          {token.tokenNumber != null
            ? `#${String(token.tokenNumber).padStart(3, "0")}`
            : shortTokenId(token.id)}
          {(isActive || isNotStarted) && (
            <span className={`${styles.liveBadge} ${isNotStarted ? styles.badgeUpcoming : styles.badgeActive}`}>
              ● {isNotStarted ? "UPCOMING" : "ACTIVE"}
            </span>
          )}
        </div>
        <div className={styles.topRight}>
          {showBillBtn && (
            <button className={styles.billBtn} onClick={() => onBill?.(token)} title="View bill">
              🧾 Bill
            </button>
          )}
          {/* Legacy End Session button */}
          {!isPrebooked && isActive && !showEnd && (
            <button className={styles.endBtn} onClick={() => { setExitTime(nowTimeStr()); setShowEnd(true); }}>
              ⏹ End Session
            </button>
          )}
          {!isPrebooked && isActive && showEnd && (
            <button className={styles.cancelBtn} onClick={() => setShowEnd(false)}>✕ Cancel</button>
          )}
          {isOwner && !token.paid && (
            <button className={styles.voidBtn} onClick={handleVoid} title="Void this token (owner only)">
              ✕ Void
            </button>
          )}
          <button
            className={`${styles.paidBtn} ${token.paid ? styles.paidActive : ""}`}
            onClick={handleTogglePaid}
            title={
              isPrebooked && !token.paid
                ? "Open bill to collect payment"
                : !isPrebooked && isActive
                ? "End session before marking payment"
                : token.paid && !isOwner
                ? "Only the owner can reverse a payment"
                : undefined
            }
            style={canTogglePaidStyle ? { cursor: "not-allowed", opacity: 0.6 } : undefined}
          >
            {token.paid ? "✓ Paid" : "Unpaid"}
          </button>
        </div>
      </div>

      {/* ── Prebooked: countdown remaining ── */}
      {isPrebooked && isActive && (
        <div className={styles.liveTimer}>
          ⏱ {remainingDisplay()} remaining
        </div>
      )}

      {/* ── Prebooked: starts soon ── */}
      {isPrebooked && isNotStarted && (
        <div className={styles.upcomingTimer}>
          Starts in {startsInDisplay()}
        </div>
      )}

      {/* ── Legacy: elapsed timer ── */}
      {!isPrebooked && isActive && !showEnd && (
        <div className={styles.liveTimer}>
          Swimming for {formatDuration(legacyMins)}
        </div>
      )}

      {/* ── Legacy: End session form ── */}
      {!isPrebooked && showEnd && (
        <div className={styles.endForm}>
          <div className={styles.endRow}>
            <label className={styles.endLabel}>Exit time</label>
            <input
              type="time"
              className={styles.timeInput}
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
            />
          </div>
          {preview && (
            <div className={styles.endPreview}>
              <span>Actual: {formatDuration(preview.actualMins)}</span>
              <span>Billed: {preview.billedHours} hr{preview.billedHours !== 1 ? "s" : ""}</span>
              <span className={styles.endPreviewTotal}>৳{preview.total.toLocaleString()}</span>
            </div>
          )}
          {endError && <p className={styles.endError}>{endError}</p>}
          <button className={styles.confirmEndBtn} onClick={confirmEnd} disabled={ending}>
            {ending ? "Saving…" : "Confirm & Open Bill"}
          </button>
        </div>
      )}

      {/* ── Customer name + Phone ── */}
      <div className={styles.phoneRow}>
        <span className={styles.phoneLabel}>👤</span>
        <span className={styles.phoneVal}>{token.customerName || "—"}</span>
      </div>
      {token.phone && (
        <div className={styles.phoneRow}>
          <span className={styles.phoneLabel}>📞</span>
          <span className={styles.phoneVal}>{token.phone}</span>
        </div>
      )}

      {/* ── Session details ── */}
      <div className={styles.details}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>People</span>
          <span className={styles.statVal}>{token.people}</span>
        </span>
        <span className={styles.divider}>×</span>
        {token.hours != null ? (
          <>
            <span className={styles.stat}>
              <span className={styles.statLabel}>Hours</span>
              <span className={styles.statVal}>{token.hours}</span>
            </span>
            <span className={styles.divider}>×</span>
          </>
        ) : null}
        <span className={styles.stat}>
          <span className={styles.statLabel}>Rate</span>
          <span className={styles.statVal}>৳{rate.toLocaleString()}</span>
        </span>
      </div>

      {/* ── Bottom: total + times ── */}
      <div className={styles.bottom}>
        <span className={styles.total}>
          {displayTotal != null
            ? `৳${displayTotal.toLocaleString()}`
            : <span className={styles.pendingTotal}>Bill pending</span>}
        </span>
        <div className={styles.timesCol}>
          {editingEntry ? (
            <div className={styles.editTimeRow}>
              <input
                type="time"
                className={styles.timeInput}
                value={entryInput}
                onChange={(e) => setEntryInput(e.target.value)}
                autoFocus
              />
              <button className={styles.saveTimeBtn} onClick={saveEntryTime}>✓</button>
              <button className={styles.cancelTimeBtn} onClick={() => setEditingEntry(false)}>✕</button>
            </div>
          ) : (
            <span className={styles.time}>
              In: {formatEntryTime(token.entryTime)}
              <button
                className={styles.editTimeBtn}
                onClick={() => {
                  const t = token.entryTime?.toDate ? token.entryTime.toDate() : null;
                  setEntryInput(t ? t.toTimeString().slice(0, 5) : "");
                  setEditingEntry(true);
                }}
                title="Edit entry time"
              >✏</button>
            </span>
          )}
          {token.exitTime && (
            <span className={styles.time}>Out: {formatExitTime(token.exitTime)}</span>
          )}
        </div>
      </div>

      {confirmDlg && (
        <ConfirmDialog
          title={confirmDlg.title}
          message={confirmDlg.message}
          variant={confirmDlg.variant ?? "primary"}
          confirmLabel={confirmDlg.confirmLabel ?? "Confirm"}
          onConfirm={async () => { setConfirmDlg(null); await confirmDlg.onConfirm(); }}
            onCancel={() => setConfirmDlg(null)}
        />
      )}
    </div>
  );
}
