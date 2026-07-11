import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { printTurfReceipt } from "./printTurfReceipt";
import PaymentMethodPicker, { METHOD_LABELS } from "../../components/PaymentMethodPicker";
import ConfirmDialog from "../../components/ConfirmDialog";
import { formatTime } from "./turf.utils";
import { useAuth } from "../../auth/AuthContext";
import styles from "./TurfReceipt.module.css";

export default function TurfReceipt({ booking, slot, date, onClose }) {
  const { displayName, isOwner } = useAuth();

  const [paid, setPaid]               = useState(booking.paid ?? false);
  const [discountType, setDiscountType] = useState(booking.discountType ?? "percent");
  const [discountValue, setDiscountValue] = useState(
    booking.discountValue ? String(booking.discountValue) : ""
  );
  const [taxPercent, setTaxPercent]   = useState(
    booking.taxPercent ? String(booking.taxPercent) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState(booking.paymentMethod ?? "cash");
  const [hasPaymentMethod, setHasPaymentMethod] = useState(!!booking.paymentMethod);
  const [payTxId,      setPayTxId]    = useState(booking.paymentTxId ?? "");
  const [payNote,      setPayNote]    = useState(booking.paymentNote ?? "");
  const [showPicker,   setShowPicker] = useState(false);
  const [saving,       setSaving]     = useState(false);
  const [toggling,     setToggling]   = useState(false);
  const [confirmDlg,   setConfirmDlg] = useState(null);
  // Owner-only edit mode after payment is collected
  const [ownerEditing, setOwnerEditing] = useState(false);

  const basePrice = booking.price ?? 0;
  const advance   = booking.advancePaid ?? 0;

  const discVal     = Math.max(0, parseFloat(discountValue) || 0);
  const discountAmt =
    discVal > 0
      ? discountType === "percent"
        ? Math.round((basePrice * Math.min(discVal, 100)) / 100)
        : Math.min(discVal, basePrice)
      : 0;
  const afterDiscount = basePrice - discountAmt;
  const taxPct    = Math.max(0, Math.min(100, parseFloat(taxPercent) || 0));
  const taxAmt    = taxPct > 0 ? Math.round((afterDiscount * taxPct) / 100) : 0;
  const total     = afterDiscount + taxAmt;
  const remaining = Math.max(0, total - advance);

  // Fields are editable when: not yet paid, OR owner is in edit mode
  const canEdit = !paid || (isOwner && ownerEditing);

  const slotLabel = slot
    ? `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
    : (booking.slotLabel ?? "");

  // Merge save + collect payment into a single Firestore write
  async function handleConfirmPayment() {
    setToggling(true);
    try {
      await updateDoc(doc(db, "turfBookings", booking.id), {
        // Persist discount/tax at the moment of payment
        discountType,
        discountValue: discVal,
        discountAmt,
        taxPercent: taxPct,
        taxAmt,
        finalTotal: total,
        // Payment fields
        paid: true,
        paymentMethod,
        paymentTxId: payTxId.trim() || null,
        paymentNote: payNote.trim() || null,
      });
      setPaid(true);
      setShowPicker(false);
      setHasPaymentMethod(true);
    } finally {
      setToggling(false);
    }
  }

  // Owner-only: save adjusted discount/tax on an already-paid bill
  async function handleOwnerSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "turfBookings", booking.id), {
        discountType,
        discountValue: discVal,
        discountAmt,
        taxPercent: taxPct,
        taxAmt,
        finalTotal: total,
      });
      setOwnerEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleMarkUnpaid() {
    setConfirmDlg({
      title: "Mark as Unpaid?",
      message: "This will remove the paid status from this booking.",
      variant: "danger",
      confirmLabel: "Mark Unpaid",
      onConfirm: async () => {
        setToggling(true);
        try {
          await updateDoc(doc(db, "turfBookings", booking.id), { paid: false });
          setPaid(false);
          setOwnerEditing(false);
        } finally {
          setToggling(false);
        }
      },
    });
  }

  function handlePrint() {
    printTurfReceipt({
      booking,
      slotLabel,
      date,
      basePrice,
      discountAmt,
      discountType,
      discountValue: discVal,
      taxPercent: taxPct,
      taxAmt,
      total,
      advance,
      remaining,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      issuedBy: displayName || null,
    });
  }

  return (
    <>
      {/* ── Controls bar ── */}
      <div className={styles.controls}>
        <button className={styles.printBtn} onClick={handlePrint}>
          Print / Save PDF
        </button>

        {paid ? (
          <>
            {/* Owner: edit or mark unpaid */}
            {isOwner && !ownerEditing && (
              <button className={styles.editBillBtn} onClick={() => setOwnerEditing(true)}>
                ✏ Edit Bill
              </button>
            )}
            {isOwner && ownerEditing && (
              <>
                <button className={styles.saveBtn} onClick={handleOwnerSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button className={styles.cancelEditBtn} onClick={() => setOwnerEditing(false)}>
                  Cancel
                </button>
              </>
            )}
            {isOwner && (
              <button className={styles.unpaidBtn} onClick={handleMarkUnpaid} disabled={toggling}>
                {toggling ? "..." : "Mark Unpaid"}
              </button>
            )}
          </>
        ) : (
          /* Not yet paid: show collect button */
          <button
            className={showPicker ? styles.cancelBtn : styles.paidBtn}
            onClick={() => setShowPicker((p) => !p)}
          >
            {showPicker
              ? "✕ Cancel"
              : remaining > 0
              ? `Collect ৳${remaining.toLocaleString()}`
              : "Mark Paid"}
          </button>
        )}

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>

      {/* ── Payment picker (only before payment) ── */}
      {showPicker && !paid && (
        <div className={styles.payPickerSection}>
          <PaymentMethodPicker
            value={paymentMethod}
            onChange={setPaymentMethod}
            txId={payTxId}
            onTxIdChange={setPayTxId}
            note={payNote}
            onNoteChange={setPayNote}
            compact
          />
          <button
            className={styles.confirmPayBtn}
            onClick={handleConfirmPayment}
            disabled={toggling}
          >
            {toggling
              ? "Saving..."
              : `Confirm & Save — ${METHOD_LABELS[paymentMethod]}`}
          </button>
        </div>
      )}

      {/* ── Receipt paper ── */}
      <div className={styles.receipt}>
        <div className={styles.header}>
          <div className={styles.arenaName}>Rangpur Sports Arena</div>
          <div className={styles.arenaTagline}>Turf Booking</div>
          <div className={styles.dateTime}>{date}</div>
          <div className={paid ? styles.stampPaid : styles.stampUnpaid}>
            {paid ? "PAID" : "UNPAID"}
          </div>
        </div>

        <div className={styles.dashed} />

        <div className={styles.serviceSection}>
          <div className={styles.serviceRow}>
            <span className={styles.serviceLabel}>Customer</span>
            <span>{booking.customerName}</span>
          </div>
          <div className={styles.serviceRow}>
            <span className={styles.serviceLabel}>Phone</span>
            <span>{booking.phone}</span>
          </div>
          <div className={styles.serviceRow}>
            <span className={styles.serviceLabel}>Slot</span>
            <span>{slotLabel}</span>
          </div>
          <div className={styles.serviceRow}>
            <span className={styles.serviceLabel}>Capacity</span>
            <span>{booking.tier} players</span>
          </div>
          {booking.notes && (
            <div className={styles.serviceRow}>
              <span className={styles.serviceLabel}>Notes</span>
              <span>{booking.notes}</span>
            </div>
          )}
        </div>

        <div className={styles.dashed} />

        <div className={styles.totalsSection}>
          <div className={styles.totalRow}>
            <span>Base Price</span>
            <span>&#2547;{basePrice.toLocaleString()}</span>
          </div>

          {/* Discount row — editable before payment or for owner in edit mode */}
          <div className={styles.adjustRow}>
            <span className={styles.adjustLabel}>Discount</span>
            {canEdit ? (
              <div className={styles.adjustInputs}>
                <button
                  type="button"
                  className={`${styles.typeToggle} ${discountType === "percent" ? styles.typeActive : ""}`}
                  onClick={() => setDiscountType("percent")}
                >%</button>
                <button
                  type="button"
                  className={`${styles.typeToggle} ${discountType === "fixed" ? styles.typeActive : ""}`}
                  onClick={() => setDiscountType("fixed")}
                >&#2547;</button>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className={styles.adjustInput}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            ) : (
              <span className={styles.frozenValue}>
                {discountAmt > 0
                  ? `${discountType === "percent" ? discVal + "%" : "৳" + discVal}`
                  : "—"}
              </span>
            )}
            {discountAmt > 0 && (
              <span className={styles.discountAmt}>- &#2547;{discountAmt.toLocaleString()}</span>
            )}
          </div>

          {/* Tax row */}
          <div className={styles.adjustRow}>
            <span className={styles.adjustLabel}>VAT/Tax (%)</span>
            {canEdit ? (
              <div className={styles.adjustInputs}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  className={styles.adjustInput}
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                />
              </div>
            ) : (
              <span className={styles.frozenValue}>
                {taxPct > 0 ? `${taxPct}%` : "—"}
              </span>
            )}
            {taxAmt > 0 && (
              <span className={styles.taxAmt}>+ &#2547;{taxAmt.toLocaleString()}</span>
            )}
          </div>

          <div className={styles.thinLine} />

          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>TOTAL</span>
            <span>&#2547;{total.toLocaleString()}</span>
          </div>

          {advance > 0 && (
            <>
              <div className={`${styles.totalRow} ${styles.advanceRow}`}>
                <span>Advance Paid</span>
                <span>- &#2547;{advance.toLocaleString()}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.remainingRow}`}>
                <span>Remaining Due</span>
                <span>&#2547;{remaining.toLocaleString()}</span>
              </div>
            </>
          )}
          {paid && hasPaymentMethod && (
            <div className={`${styles.totalRow} ${styles.paymentRow}`}>
              <span>Payment</span>
              <span>{METHOD_LABELS[paymentMethod]}</span>
            </div>
          )}
        </div>

        <div className={styles.dashed} />

        <div className={styles.footer}>
          <p>Thank you for booking!</p>
          <p>Rangpur Sports Arena</p>
          {displayName && (
            <p className={styles.servedBy}>Served by: {displayName}</p>
          )}
        </div>
      </div>

      {confirmDlg && (
        <ConfirmDialog
          title={confirmDlg.title}
          message={confirmDlg.message}
          variant={confirmDlg.variant ?? "danger"}
          confirmLabel={confirmDlg.confirmLabel ?? "Confirm"}
          onConfirm={async () => { setConfirmDlg(null); await confirmDlg.onConfirm(); }}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
    </>
  );
}
