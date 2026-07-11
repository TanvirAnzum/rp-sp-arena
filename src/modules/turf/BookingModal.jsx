import { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../auth/AuthContext";
import { formatTime, TIERS } from "./turf.utils";
import { isValidBDPhone } from "../../utils/phoneValidation";
import ConfirmDialog from "../../components/ConfirmDialog";
import PaymentMethodPicker from "../../components/PaymentMethodPicker";
import styles from "./BookingModal.module.css";

export default function BookingModal({ slot, booking, date, onClose, onBill }) {
  const { user } = useAuth();
  const isNew = !booking;

  /* ── Form state (new booking) ── */
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [tier, setTier]       = useState("");
  const [notes, setNotes]     = useState("");
  const [advance,       setAdvance]       = useState("");
  const [advPayMethod,  setAdvPayMethod]  = useState("cash");
  const [advTxId,       setAdvTxId]       = useState("");
  const [advNote,       setAdvNote]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);

  /* ── Cancel state (existing booking) ── */
  const [showCancel, setShowCancel]     = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const availableTiers = TIERS.filter((t) => slot.prices?.[t] > 0);
  const selectedPrice  = tier ? slot.prices[tier] : null;

  function handleBook(e) {
    e.preventDefault();
    if (!isValidBDPhone(phone)) return setError("Enter a valid Bangladeshi phone number (e.g. 01712345678).");
    if (!tier) return setError("Please select a capacity tier.");
    const adv = Number(advance) || 0;
    if (adv > slot.prices[tier]) {
      return setError(`Advance (৳${adv.toLocaleString()}) cannot exceed the slot price (৳${slot.prices[tier].toLocaleString()}).`);
    }
    setError("");
    setConfirmDlg({
      title: "Confirm Booking",
      message: `Book ${tier}-player slot for ${name.trim() || "customer"} on ${date}${
        adv > 0 ? ` — Advance: ৳${adv.toLocaleString()}` : ""
      }?`,
      onConfirm: doBook,
    });
  }

  async function doBook() {
    setConfirmDlg(null);
    setSaving(true);
    setError("");
    try {
      const adv = Number(advance) || 0;
      await addDoc(collection(db, "turfBookings"), {
        slotId:       slot.id,
        slotLabel:    `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`,
        date,
        customerName: name.trim(),
        phone:        phone.trim(),
        tier,
        price:        slot.prices[tier],
        notes:        notes.trim() || null,
        advancePaid:        adv,
        advPaymentMethod:   adv > 0 ? advPayMethod : null,
        advPaymentTxId:     adv > 0 ? (advTxId.trim() || null) : null,
        advPaymentNote:     adv > 0 ? (advNote.trim() || null) : null,
        paid:               adv >= slot.prices[tier],
        status:       "booked",
        cancelReason: "",
        createdAt:    serverTimestamp(),
        createdBy:    user.uid,
      });
      onClose();
    } catch {
      setError("Failed to save booking. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function requestCancel(e) {
    e.preventDefault();
    setConfirmDlg({
      title: "Cancel This Booking?",
      message: `This will free the slot for ${booking?.customerName ?? "the customer"}. This cannot be undone.`,
      variant: "danger",
      confirmLabel: "Yes, Cancel Booking",
      onConfirm: doCancel,
    });
  }

  async function doCancel() {
    setConfirmDlg(null);
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "turfBookings", booking.id), {
        status:       "cancelled",
        cancelReason: cancelReason.trim(),
      });
      onClose();
    } catch {
      setError("Failed to cancel booking.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.slotTime}>
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </h3>
            <span className={styles.dateLabel}>{date}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── NEW BOOKING FORM ── */}
        {isNew && (
          <form onSubmit={handleBook} className={styles.form}>
            <div className={styles.field}>
              <label>Customer Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Capacity Tier</label>
              <div className={styles.tierGroup}>
                {availableTiers.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.tierBtn} ${tier === t ? styles.tierSelected : ""}`}
                    onClick={() => setTier(t)}
                  >
                    <span className={styles.tierPlayers}>{t} players</span>
                    <span className={styles.tierPrice}>৳{slot.prices[t].toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label>Advance Paid (৳)</label>
              <input
                type="number"
                min="0"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                placeholder="0"
              />
            </div>

            {Number(advance) > 0 && (
              <div className={styles.field}>
                <PaymentMethodPicker
                  value={advPayMethod}
                  onChange={setAdvPayMethod}
                  txId={advTxId}
                  onTxIdChange={setAdvTxId}
                  note={advNote}
                  onNoteChange={setAdvNote}
                  compact
                />
              </div>
            )}

            <div className={styles.field}>
              <label>Notes / Remarks <span className={styles.optional}>(optional)</span></label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Birthday group, bring bibs"
              />
            </div>

            {selectedPrice && (
              <div className={styles.summary}>
                <span>Total Price</span>
                <strong>৳{selectedPrice.toLocaleString()}</strong>
              </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? "Booking…" : "Confirm Booking"}
            </button>
          </form>
        )}

        {/* ── EXISTING BOOKING VIEW ── */}
        {!isNew && !showCancel && (
          <div className={styles.viewSection}>
            <div className={styles.detailGrid}>
              <span className={styles.label}>Customer</span>
              <span>{booking.customerName}</span>
              <span className={styles.label}>Phone</span>
              <span>{booking.phone}</span>
              <span className={styles.label}>Capacity</span>
              <span>{booking.tier} players</span>
              <span className={styles.label}>Total Price</span>
              <span>৳{booking.price?.toLocaleString()}</span>
              <span className={styles.label}>Advance Paid</span>
              <span>৳{booking.advancePaid?.toLocaleString() ?? "0"}</span>
              <span className={styles.label}>Due</span>
              <span>৳{((booking.price ?? 0) - (booking.advancePaid ?? 0)).toLocaleString()}</span>
              <span className={styles.label}>Status</span>
              <span className={styles.statusBadge}>{booking.status}</span>
              {booking.notes && (
                <>
                  <span className={styles.label}>Notes</span>
                  <span>{booking.notes}</span>
                </>
              )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actionRow}>
              {booking.status === "booked" && onBill && (
                <button
                  className={styles.billBtn}
                  onClick={() => { onClose(); onBill(booking, slot); }}
                >
                  🧾 Generate Bill
                </button>
              )}
              <button
                className={styles.cancelTrigger}
                onClick={() => setShowCancel(true)}
              >
                Cancel Booking
              </button>
            </div>
          </div>
        )}

        {/* ── CANCEL FORM ── */}
        {!isNew && showCancel && (
          <form onSubmit={requestCancel} className={styles.form}>
            <p className={styles.cancelWarning}>
              This will free the slot. This action cannot be undone.
            </p>

            <div className={styles.field}>
              <label>Reason (optional)</label>
              <input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer request"
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.row}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setShowCancel(false)}
              >
                Go Back
              </button>
              <button type="submit" className={styles.confirmCancelBtn} disabled={saving}>
                {saving ? "Cancelling…" : "Cancel Booking"}
              </button>
            </div>
          </form>
        )}
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
