import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { printSwimmingReceipt } from "./printSwimmingReceipt";
import PaymentMethodPicker, { METHOD_LABELS } from "../../components/PaymentMethodPicker";
import ConfirmDialog from "../../components/ConfirmDialog";
import { shortTokenId, formatEntryTime, formatExitTime, getOvertimeMinutes } from "./swimming.utils";
import { useAuth } from "../../auth/AuthContext";
import styles from "./SwimmingReceipt.module.css";

export default function SwimmingReceipt({ token, onClose }) {
  const { displayName, isOwner } = useAuth();

  const [paid, setPaid]               = useState(token.paid ?? false);
  const [discountType, setDiscountType] = useState(token.discountType ?? "percent");
  const [discountValue, setDiscountValue] = useState(
    token.discountValue ? String(token.discountValue) : ""
  );
  const [taxPercent, setTaxPercent]   = useState(
    token.taxPercent ? String(token.taxPercent) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState(token.paymentMethod ?? "cash");
  const [hasPaymentMethod, setHasPaymentMethod] = useState(!!token.paymentMethod);
  const [payTxId,       setPayTxId]       = useState(token.paymentTxId ?? "");
  const [payNote,       setPayNote]       = useState(token.paymentNote ?? "");
  const [showPicker,    setShowPicker]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [toggling,      setToggling]      = useState(false);
  const [confirmDlg,    setConfirmDlg]    = useState(null);
  const [ownerEditing,  setOwnerEditing]  = useState(false);

  const sessionEnded = !!token.exitTime;

  const subtotal  = token.totalPrice ?? 0;
  const discVal   = Math.max(0, parseFloat(discountValue) || 0);
  const discountAmt =
    discVal > 0
      ? discountType === "percent"
        ? Math.round((subtotal * Math.min(discVal, 100)) / 100)
        : Math.min(discVal, subtotal)
      : 0;
  const afterDiscount = subtotal - discountAmt;
  const taxPct    = Math.max(0, Math.min(100, parseFloat(taxPercent) || 0));
  const taxAmt    = taxPct > 0 ? Math.round((afterDiscount * taxPct) / 100) : 0;
  const total     = afterDiscount + taxAmt;

  const canEdit = !paid || (isOwner && ownerEditing);

  const tokenLabel =
    token.tokenNumber != null
      ? "#" + String(token.tokenNumber).padStart(3, "0")
      : shortTokenId(token.id);

  async function handleConfirmPayment() {
    setToggling(true);
    try {
      await updateDoc(doc(db, "swimmingTokens", token.id), {
        discountType,
        discountValue: discVal,
        discountAmt,
        taxPercent: taxPct,
        taxAmt,
        finalTotal: total,
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

  async function handleOwnerSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, "swimmingTokens", token.id), {
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
      message: "This will remove the paid status from this token.",
      variant: "danger",
      confirmLabel: "Mark Unpaid",
      onConfirm: async () => {
        setToggling(true);
        try {
          await updateDoc(doc(db, "swimmingTokens", token.id), { paid: false });
          setPaid(false);
          setOwnerEditing(false);
        } finally {
          setToggling(false);
        }
      },
    });
  }

  function handlePrint() {
    const overtime = getOvertimeMinutes(token.entryTime, token.exitTime, token.hours);
    printSwimmingReceipt({
      token,
      subtotal,
      discountAmt,
      discountType,
      discountValue: discVal,
      taxPercent: taxPct,
      taxAmt,
      total,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      exitTime: token.exitTime ?? null,
      overtime,
      issuedBy: displayName || null,
    });
  }

  return (
    <>
      <div className={styles.controls}>
        <button className={styles.printBtn} onClick={handlePrint}>
          Print / Save PDF
        </button>

        {paid ? (
          <>
            {isOwner && !ownerEditing && (
              <button className={styles.editBillBtn} onClick={() => setOwnerEditing(true)}>
                Edit Bill
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
        ) : sessionEnded ? (
          <button
            className={showPicker ? styles.cancelBtn : styles.paidBtn}
            onClick={() => setShowPicker((p) => !p)}
          >
            {showPicker ? "Cancel" : "Collect Payment"}
          </button>
        ) : (
          <span className={styles.activeWarning}>
            Session still active — end session before collecting payment
          </span>
        )}

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>

      {showPicker && !paid && sessionEnded && (
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
          <button className={styles.confirmPayBtn} onClick={handleConfirmPayment} disabled={toggling}>
            {toggling ? "Saving..." : "Confirm & Save — " + METHOD_LABELS[paymentMethod]}
          </button>
        </div>
      )}

      <div className={styles.receipt}>
        <div className={styles.header}>
          <div className={styles.arenaName}>Rangpur Sports Arena</div>
          <div className={styles.arenaTagline}>Swimming Pool</div>
          <div className={styles.tokenBadge}>TOKEN {tokenLabel}</div>
          <div className={styles.dateTime}>
            {token.date} &nbsp;&#183;&nbsp; In: {formatEntryTime(token.entryTime)}
            {token.exitTime && (
              <> &nbsp;&#183;&nbsp; Out: {formatExitTime(token.exitTime)}</>
            )}
          </div>
          <div className={paid ? styles.stampPaid : styles.stampUnpaid}>
            {paid ? "PAID" : "UNPAID"}
          </div>
        </div>

        <div className={styles.dashed} />

        <div className={styles.serviceSection}>
          <div className={styles.serviceRow}>
            <span className={styles.serviceLabel}>People</span>
            <span>{token.people}</span>
          </div>
          {token.phone && (
            <div className={styles.serviceRow}>
              <span className={styles.serviceLabel}>Phone</span>
              <span>{token.phone}</span>
            </div>
          )}
          <div className={styles.serviceRow}>
            <span className={styles.serviceLabel}>Hours</span>
            <span>{token.hours}</span>
          </div>
          <div className={styles.serviceRow}>
            <span className={styles.serviceLabel}>Rate / person / hr</span>
            <span>&#2547;{(token.pricePerPersonPerHour ?? 0).toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.dashed} />

        <div className={styles.totalsSection}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>&#2547;{subtotal.toLocaleString()}</span>
          </div>

          <div className={styles.adjustRow}>
            <span className={styles.adjustLabel}>Discount</span>
            {canEdit ? (
              <div className={styles.adjustInputs}>
                <button
                  type="button"
                  className={styles.typeToggle + (discountType === "percent" ? " " + styles.typeActive : "")}
                  onClick={() => setDiscountType("percent")}
                >%</button>
                <button
                  type="button"
                  className={styles.typeToggle + (discountType === "fixed" ? " " + styles.typeActive : "")}
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
                  ? (discountType === "percent" ? discVal + "%" : "৳" + discVal)
                  : "—"}
              </span>
            )}
            {discountAmt > 0 && (
              <span className={styles.discountAmt}>- &#2547;{discountAmt.toLocaleString()}</span>
            )}
          </div>

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
                {taxPct > 0 ? taxPct + "%" : "—"}
              </span>
            )}
            {taxAmt > 0 && (
              <span className={styles.taxAmt}>+ &#2547;{taxAmt.toLocaleString()}</span>
            )}
          </div>

          <div className={styles.thinLine} />

          <div className={styles.totalRow + " " + styles.grandTotal}>
            <span>TOTAL</span>
            <span>&#2547;{total.toLocaleString()}</span>
          </div>
          {paid && hasPaymentMethod && (
            <div className={styles.totalRow + " " + styles.paymentRow}>
              <span>Payment</span>
              <span>{METHOD_LABELS[paymentMethod]}</span>
            </div>
          )}
        </div>

        <div className={styles.dashed} />

        <div className={styles.footer}>
          <p>Thank you for visiting!</p>
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
