import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { printReceipt } from "./printReceipt";
import PaymentMethodPicker, { METHOD_LABELS } from "../../components/PaymentMethodPicker";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../auth/AuthContext";
import styles from "./Receipt.module.css";

export default function Receipt({ sale, salesCol, onClose }) {
  const { displayName, isOwner } = useAuth();
  const [paid,          setPaid]          = useState(sale.paid ?? false);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod ?? "cash");
  const [hasPaymentMethod, setHasPaymentMethod] = useState(!!sale.paymentMethod);
  const [payTxId,       setPayTxId]       = useState(sale.paymentTxId ?? "");
  const [payNote,       setPayNote]       = useState(sale.paymentNote ?? "");
  const [showPicker,    setShowPicker]    = useState(false);
  const [toggling,      setToggling]      = useState(false);
  const [confirmDlg,    setConfirmDlg]    = useState(null);

  const {
    id: saleId,
    items = [],
    subtotal = 0,
    discountAmt = 0,
    discountType,
    discountValue,
    taxPercent = 0,
    taxAmt = 0,
    total = 0,
    tokenNumber,
    receiptDate,
  } = sale;

  const tokenLabel = tokenNumber != null
    ? `#${String(tokenNumber).padStart(3, "0")}`
    : null;

  const canEdit = !!(saleId && salesCol);

  async function confirmPaid() {
    if (!canEdit) return;
    setToggling(true);
    try {
      await updateDoc(doc(db, salesCol, saleId), {
        paid: true,
        paymentMethod,
        paymentTxId:  payTxId.trim() || null,
        paymentNote:  payNote.trim() || null,
      });
      setPaid(true);
      setShowPicker(false);
      setHasPaymentMethod(true);
    } finally {
      setToggling(false);
    }
  }

  function handleMarkUnpaid() {
    if (!canEdit) return;
    setConfirmDlg({
      title: "Mark as Unpaid?",
      message: "This will remove the paid status from this sale.",
      variant: "danger",
      confirmLabel: "Mark Unpaid",
      onConfirm: async () => {
        setToggling(true);
        try {
          await updateDoc(doc(db, salesCol, saleId), { paid: false });
          setPaid(false);
        } finally {
          setToggling(false);
        }
      },
    });
  }

  function handlePrint() {
    printReceipt({
      sale,
      paid,
      paymentMethod: paid ? paymentMethod : null,
      issuedBy: displayName || null,
    });
  }

  return (
    <>
      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.printBtn} onClick={handlePrint}>
          Print / Save PDF
        </button>
        {canEdit && (
          paid ? (
            isOwner && (
              <button className={styles.unpaidBtn} onClick={handleMarkUnpaid} disabled={toggling}>
                {toggling ? "..." : "Mark Unpaid"}
              </button>
            )
          ) : (
            <button
              className={showPicker ? styles.cancelBtn : styles.paidBtn}
              onClick={() => setShowPicker((p) => !p)}
            >
              {showPicker ? "X Cancel" : "Mark Paid"}
            </button>
          )
        )}
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>

      {/* Inline payment picker */}
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
          <button className={styles.confirmPayBtn} onClick={confirmPaid} disabled={toggling}>
            {toggling ? "Saving..." : `Confirm Payment - ${METHOD_LABELS[paymentMethod]}`}
          </button>
        </div>
      )}

      {/* Receipt paper */}
      <div className={styles.receipt}>
        <div className={styles.header}>
          <div className={styles.arenaName}>Rangpur Sports Arena</div>
          <div className={styles.arenaTagline}>Your game, our arena.</div>
          {tokenLabel && <div className={styles.tokenBadge}>TOKEN {tokenLabel}</div>}
          <div className={styles.dateTime}>{receiptDate}</div>
          <div className={paid ? styles.stampPaid : styles.stampUnpaid}>
            {paid ? "PAID" : "UNPAID"}
          </div>
        </div>

        <div className={styles.dashed} />

        <div className={styles.itemsSection}>
          <div className={`${styles.itemRow} ${styles.itemHeader}`}>
            <span className={styles.colItem}>Item</span>
            <span className={styles.colQty}>Qty</span>
            <span className={styles.colPrice}>Price</span>
            <span className={styles.colSub}>Amount</span>
          </div>
          <div className={styles.thinLine} />
          {items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span className={styles.colItem}>{item.name}</span>
              <span className={styles.colQty}>{item.quantity}</span>
              <span className={styles.colPrice}>&#2547;{item.price?.toLocaleString()}</span>
              <span className={styles.colSub}>&#2547;{item.subtotal?.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div className={styles.dashed} />

        <div className={styles.totalsSection}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>&#2547;{subtotal.toLocaleString()}</span>
          </div>
          {discountAmt > 0 && (
            <div className={`${styles.totalRow} ${styles.discountRow}`}>
              <span>Discount{discountType === "percent" ? ` (${discountValue}%)` : " (Fixed)"}</span>
              <span>- &#2547;{discountAmt.toLocaleString()}</span>
            </div>
          )}
          {taxAmt > 0 && (
            <div className={styles.totalRow}>
              <span>Tax ({taxPercent}%)</span>
              <span>+ &#2547;{taxAmt.toLocaleString()}</span>
            </div>
          )}
          <div className={styles.thinLine} />
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>TOTAL</span>
            <span>&#2547;{total.toLocaleString()}</span>
          </div>
          {paid && hasPaymentMethod && (
            <div className={`${styles.totalRow} ${styles.paymentRow}`}>
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
