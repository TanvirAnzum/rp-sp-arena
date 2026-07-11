import { useState } from "react";
import {
  addDoc, collection, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../auth/AuthContext";
import { useDayExpenses } from "./hooks/useDayExpenses";
import { toDateStr, formatDateLabel } from "../food/pos.utils";
import ConfirmDialog from "../../components/ConfirmDialog";
import styles from "./ExpensesPage.module.css";

export default function ExpensesPage() {
  const { isOwner, user } = useAuth();
  const today = toDateStr(new Date());

  const [date, setDate] = useState(today);

  // Staff is always locked to today
  const activeDate = isOwner ? date : today;

  const { expenses, loading } = useDayExpenses(activeDate);

  // Add form state
  const [note,   setNote]   = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  // Confirm dialog state (for both add and delete)
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);

  function changeDate(delta) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(toDateStr(d));
  }

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  function handleAdd(ev) {
    ev.preventDefault();
    if (!note.trim()) return setError("Please enter a description.");
    if (!amount || Number(amount) <= 0) return setError("Enter a valid amount.");
    setError("");
    setConfirmDlg({
      title: "Add Expense",
      message: `Add expense of ৳${Number(amount).toLocaleString()} for "${note.trim()}"?`,
      onConfirm: async () => {
        setSaving(true);
        setError("");
        try {
          await addDoc(collection(db, "expenses"), {
            note:          note.trim(),
            amount:        Number(amount),
            date:          activeDate,
            createdAt:     serverTimestamp(),
            createdBy:     user.uid,
            createdByName: user.displayName || user.email,
          });
          setNote("");
          setAmount("");
        } catch {
          setError("Failed to save. Try again.");
        } finally {
          setSaving(false);
        }
      },
    });
  }

  function handleDelete(id) {
    setConfirmDlg({
      title: "Delete Expense",
      message: "Delete this expense? This cannot be undone.",
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteDoc(doc(db, "expenses", id));
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>💸 Expenses</h2>
      </div>

      {/* Date nav — owner only */}
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
            <button className={styles.todayBtn} onClick={() => setDate(today)}>Today</button>
          </>
        ) : (
          <span className={styles.dateLabel}>{formatDateLabel(activeDate)}</span>
        )}
      </div>

      {/* Add expense form */}
      <form className={styles.addForm} onSubmit={handleAdd}>
        <h3 className={styles.formTitle}>Add Expense</h3>
        <div className={styles.formRow}>
          <input
            className={styles.noteInput}
            type="text"
            placeholder="Description (e.g. Electricity bill)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
          />
          <input
            className={styles.amountInput}
            type="number"
            min="1"
            step="1"
            placeholder="Amount (৳)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" className={styles.addBtn} disabled={saving}>
            {saving ? "…" : "+ Add"}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {/* Expense list */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : expenses.length === 0 ? (
        <p className={styles.empty}>No expenses recorded for this date.</p>
      ) : (
        <>
          <div className={styles.totalBar}>
            <span>Total Expenses for {isOwner ? formatDateLabel(date) : "Today"}</span>
            <strong className={styles.totalAmt}>৳{totalExpenses.toLocaleString()}</strong>
          </div>
          <div className={styles.list}>
            {expenses.map((exp) => (
              <div key={exp.id} className={styles.row}>
                <div className={styles.rowInfo}>
                  <span className={styles.rowNote}>{exp.note}</span>
                  {isOwner && exp.createdByName && (
                    <span className={styles.rowMeta}>by {exp.createdByName}</span>
                  )}
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.rowAmount}>৳{exp.amount?.toLocaleString()}</span>
                  {isOwner && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(exp.id)}
                      disabled={deletingId === exp.id}
                    >
                      {deletingId === exp.id ? "…" : "✕"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

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
