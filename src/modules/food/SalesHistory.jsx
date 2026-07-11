import { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../auth/AuthContext";
import { useDaySales } from "./hooks/useDaySales";
import { toDateStr, formatDateLabel, formatTime, formatReceiptDate } from "./pos.utils";
import Modal from "../../components/Modal";
import Receipt from "./Receipt";
import ConfirmDialog from "../../components/ConfirmDialog";
import styles from "./SalesHistory.module.css";

export default function SalesHistory({ salesCol }) {
  const { isOwner } = useAuth();
  const [date, setDate] = useState(toDateStr(new Date()));
  const { sales, loading } = useDaySales(salesCol, date);
  const [deleting, setDeleting] = useState(null);  // saleId being deleted
  const [toggling, setToggling] = useState(null);  // saleId being toggled
  const [billSale, setBillSale] = useState(null);  // sale being viewed as bill
  const [confirmDlg, setConfirmDlg] = useState(null);

  function changeDate(delta) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(toDateStr(d));
  }

  const dayTotal   = sales.reduce((s, sale) => s + (sale.total ?? 0), 0);
  const paidTotal  = sales.filter((s) => s.paid).reduce((sum, s) => sum + (s.total ?? 0), 0);
  const unpaidTotal = dayTotal - paidTotal;

  function togglePaid(sale) {
    setConfirmDlg({
      title: sale.paid ? "Mark as Unpaid?" : "Mark as Paid?",
      message: sale.paid
        ? "This will remove the paid status from this sale."
        : "Confirm that payment has been received for this sale.",
      variant: sale.paid ? "danger" : "primary",
      confirmLabel: sale.paid ? "Mark Unpaid" : "Mark Paid",
      onConfirm: async () => {
        setToggling(sale.id);
        try {
          await updateDoc(doc(db, salesCol, sale.id), { paid: !sale.paid });
        } finally {
          setToggling(null);
        }
      },
    });
  }

  function handleDelete(saleId) {
    setConfirmDlg({
      title: "Delete Sale",
      message: "Delete this sale permanently? This cannot be undone.",
      onConfirm: async () => {
        setDeleting(saleId);
        try {
          await deleteDoc(doc(db, salesCol, saleId));
        } finally {
          setDeleting(null);
        }
      },
    });
  }

  return (
    <div className={styles.container}>
      {/* Date nav */}
      <div className={styles.datePicker}>
        {isOwner ? (
          <>
            <button className={styles.navBtn} onClick={() => changeDate(-1)}>‹</button>
            <div className={styles.dateDisplay}>
              <span className={styles.dateLabel}>{formatDateLabel(date)}</span>
              <input
                type="date"
                className={styles.dateInput}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <button className={styles.navBtn} onClick={() => changeDate(1)}>›</button>
            <button className={styles.todayBtn} onClick={() => setDate(toDateStr(new Date()))}>Today</button>
          </>
        ) : (
          <span className={styles.dateLabel}>{formatDateLabel(date)}</span>
        )}
      </div>

      {/* Summary */}
      {sales.length > 0 && (
        <div className={styles.summary}>
          <span>{sales.length} sale{sales.length !== 1 ? "s" : ""}</span>
          <span>Total: <strong>৳{dayTotal.toLocaleString()}</strong></span>
          <span className={styles.paidStat}>Paid: <strong>৳{paidTotal.toLocaleString()}</strong></span>
          <span className={styles.unpaidStat}>Due: <strong>৳{unpaidTotal.toLocaleString()}</strong></span>
        </div>
      )}

      {/* Sale cards */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : sales.length === 0 ? (
        <p className={styles.empty}>No sales recorded for this date.</p>
      ) : (
        <div className={styles.list}>
          {sales.map((sale) => (
            <div
              key={sale.id}
              className={`${styles.saleCard} ${sale.paid ? styles.cardPaid : styles.cardUnpaid}`}
            >
              <div className={styles.saleHeader}>
                <div className={styles.saleMeta}>
                  {sale.tokenNumber != null && (
                    <span className={styles.tokenTag}>
                      #{String(sale.tokenNumber).padStart(3, "0")}
                    </span>
                  )}
                  <span className={styles.saleTime}>{formatTime(sale.createdAt)}</span>
                </div>
                <div className={styles.saleRight}>
                  <span className={styles.saleTotal}>৳{sale.total?.toLocaleString()}</span>
                  <span className={sale.paid ? styles.badgePaid : styles.badgeUnpaid}>
                    {sale.paid ? "PAID" : "UNPAID"}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className={styles.itemList}>
                {sale.items?.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQty}>× {item.quantity}</span>
                    <span className={styles.itemSub}>৳{item.subtotal?.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Discount / tax line (if any) */}
              {(sale.discountAmt > 0 || sale.taxAmt > 0) && (
                <div className={styles.adjustLine}>
                  {sale.discountAmt > 0 && (
                    <span className={styles.discountNote}>
                      Discount − ৳{sale.discountAmt?.toLocaleString()}
                    </span>
                  )}
                  {sale.taxAmt > 0 && (
                    <span className={styles.taxNote}>
                      Tax + ৳{sale.taxAmt?.toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  className={styles.btnBill}
                  onClick={() => setBillSale(sale)}
                >
                  🧾 Bill
                </button>
                {(!sale.paid || isOwner) && (
                  <button
                    className={sale.paid ? styles.btnUnpaid : styles.btnPaid}
                    onClick={() => togglePaid(sale)}
                    disabled={toggling === sale.id}
                  >
                    {toggling === sale.id ? "…" : sale.paid ? "Mark Unpaid" : "Mark Paid"}
                  </button>
                )}
                {isOwner && (
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleDelete(sale.id)}
                    disabled={deleting === sale.id}
                  >
                    {deleting === sale.id ? "Deleting…" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ── Bill modal (reprint from history) ── */}
      {billSale && (
        <Modal
          title={billSale.tokenNumber != null ? `Receipt — TOKEN #${String(billSale.tokenNumber).padStart(3, "0")}` : "Receipt"}
          onClose={() => setBillSale(null)}
          width="400px"
        >
          <Receipt
            sale={{
              ...billSale,
              receiptDate: billSale.createdAt
                ? formatReceiptDate(
                    billSale.createdAt.toDate
                      ? billSale.createdAt.toDate()
                      : new Date(billSale.createdAt)
                  )
                : "",
            }}
            salesCol={salesCol}
            onClose={() => setBillSale(null)}
          />
        </Modal>
      )}
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
    </div>
  );
}
