import { useState } from "react";
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { getNextToken } from "../../firebase/tokenCounter";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../auth/AuthContext";
import { useSwimmingSettings } from "./hooks/useSwimmingSettings";
import { isValidBDPhone } from "../../utils/phoneValidation";
import { toDateStr } from "./swimming.utils";
import ConfirmDialog from "../../components/ConfirmDialog";
import styles from "./IssueTokenForm.module.css";

function nowHHMM() {
  const n = new Date();
  return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0");
}

function addHoursToHHMM(timeStr, hours) {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMins = h * 60 + m + Math.round(hours * 60);
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return String(newH).padStart(2, "0") + ":" + String(newM).padStart(2, "0");
}

/** Round up to nearest 0.5 hr — same logic as calcBilledHours in swimming.utils */
function calcHours(startStr, endStr) {
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  let startMins = sh * 60 + sm;
  let endMins   = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60; // midnight crossover
  const diffMins = endMins - startMins;
  if (diffMins <= 0) return 0;
  return Math.ceil(diffMins / 30) * 0.5;
}

function timeStrToTimestamp(dateStr, timeStr, referenceDate = null) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(h, m, 0, 0);
  // Midnight crossover: if exit <= entry, push to next day
  if (referenceDate && d.getTime() <= referenceDate.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  return Timestamp.fromDate(d);
}

const SHORTCUTS = [1, 1.5, 2, 3];

export default function IssueTokenForm({ onIssued }) {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSwimmingSettings();

  const [people,    setPeople]    = useState("");
  const [phone,     setPhone]     = useState("");
  const [startTime, setStartTime] = useState(nowHHMM);
  const [endTime,   setEndTime]   = useState(() => addHoursToHHMM(nowHHMM(), 1));
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);

  const rate         = settings?.pricePerPersonPerHour ?? 0;
  const hours        = calcHours(startTime, endTime);
  const numPeople    = Number(people) || 0;
  const previewTotal = rate > 0 && numPeople > 0 && hours > 0
    ? Math.round(numPeople * hours * rate)
    : null;

  function handleStartNow() {
    const now = nowHHMM();
    setStartTime(now);
    // Keep existing duration if possible, or default 1h
    const currentDur = calcHours(startTime, endTime);
    setEndTime(addHoursToHHMM(now, currentDur > 0 ? currentDur : 1));
  }

  function handleShortcut(h) {
    setEndTime(addHoursToHHMM(startTime, h));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValidBDPhone(phone))
      return setError("Enter a valid Bangladesh phone number (e.g. 01712345678).");
    if (!rate)
      return setError("Swimming price not set. Ask the owner to configure it.");
    if (numPeople < 1)  return setError("At least 1 person required.");
    if (numPeople > 50) return setError("Maximum 50 people per session.");
    if (hours <= 0)     return setError("End time must be after start time.");
    setError("");
    setConfirmDlg({
      title:   "Issue Swimming Token",
      message: `Issue token for ${people} person${numPeople > 1 ? "s" : ""} from ${startTime} to ${endTime}?${previewTotal != null ? " Total: ৳" + previewTotal.toLocaleString() + "." : ""}`,
    });
  }

  async function doIssue() {
    setConfirmDlg(null);
    setSaving(true);
    const now     = new Date();
    const dateStr = toDateStr(now);
    try {
      const entryTs     = timeStrToTimestamp(dateStr, startTime);
      const exitTs      = timeStrToTimestamp(dateStr, endTime, entryTs.toDate());
      const tokenNumber = await getNextToken(db, dateStr, "swimming");
      const docRef = await addDoc(collection(db, "swimmingTokens"), {
        people:               numPeople,
        phone:                phone.trim(),
        pricePerPersonPerHour: rate,
        tokenNumber,
        date:       dateStr,
        entryTime:  entryTs,
        exitTime:   exitTs,
        hours,
        totalPrice: previewTotal ?? 0,
        paid:       false,
        prebooked:  true,
        createdAt:  serverTimestamp(),
        createdBy:  user.uid,
      });
      const issued = {
        id: docRef.id, people: numPeople, phone: phone.trim(),
        pricePerPersonPerHour: rate, tokenNumber, date: dateStr,
        entryTime: entryTs, exitTime: exitTs, hours,
        totalPrice: previewTotal ?? 0, paid: false, prebooked: true,
      };
      // Reset
      setPeople("");
      setPhone("");
      const nw = nowHHMM();
      setStartTime(nw);
      setEndTime(addHoursToHHMM(nw, 1));
      onIssued?.(issued);
    } catch {
      setError("Failed to issue token. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (settingsLoading) return null;

  return (
    <div className={styles.card}>
      <h3 className={styles.cardTitle}>Issue New Token</h3>

      {!rate && (
        <p className={styles.warning}>
          ⚠️ Swimming price not configured. The owner must set it under Settings.
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* People + Phone */}
        <div className={styles.fields}>
          <div className={styles.field}>
            <label>Number of People</label>
            <input
              type="number" min="1" max="50"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="e.g. 3"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Customer Phone</label>
            <input
              type="tel" inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>
        </div>

        {/* Start time */}
        <div className={styles.timeSection}>
          <div className={styles.timeLabelRow}>
            <label className={styles.timeLabel}>Start Time</label>
            <button type="button" className={styles.nowBtn} onClick={handleStartNow}>
              ⏱ Now
            </button>
          </div>
          <input
            type="time"
            className={styles.timeInput}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        {/* End time */}
        <div className={styles.timeSection}>
          <label className={styles.timeLabel}>End Time</label>
          <input
            type="time"
            className={styles.timeInput}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
          <div className={styles.shortcuts}>
            {SHORTCUTS.map((h) => (
              <button
                key={h}
                type="button"
                className={styles.shortcutBtn}
                onClick={() => handleShortcut(h)}
              >
                +{h}h
              </button>
            ))}
          </div>
        </div>

        {/* Live preview */}
        {hours > 0 && numPeople > 0 && rate > 0 && (
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>
                {numPeople} person{numPeople > 1 ? "s" : ""} ×{" "}
                {hours} hr{hours !== 1 ? "s" : ""} × ৳{rate.toLocaleString()}
              </span>
              <strong>= ৳{(previewTotal ?? 0).toLocaleString()}</strong>
            </div>
            <p className={styles.summaryNote}>{startTime} → {endTime}</p>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={saving || !rate}>
          {saving ? "Issuing…" : "Issue Token"}
        </button>
      </form>

      {confirmDlg && (
        <ConfirmDialog
          title={confirmDlg.title}
          message={confirmDlg.message}
          confirmLabel="Issue Token"
          onConfirm={doIssue}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
    </div>
  );
}
