import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { createStaffAccount } from "../../firebase/createStaffAccount";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import styles from "./StaffPage.module.css";

export default function StaffPage() {
  const [staffList, setStaffList]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);

  // Form state
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  // Deletion / toggling state
  const [deleting, setDeleting]       = useState(null);
  const [toggling, setToggling]       = useState(null);
  const [confirmDlg, setConfirmDlg]   = useState(null);

  // Live list of staff from Firestore
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "staff"));
    const unsub = onSnapshot(q, (snap) => {
      setStaffList(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""))
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  function resetForm() {
    setName(""); setEmail(""); setPassword(""); setError("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setSaving(true);
    setError("");
    try {
      await createStaffAccount(email.trim(), password, name.trim());
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleDisabled(staff) {
    const willDisable = !staff.disabled;
    setConfirmDlg({
      title: willDisable ? "Deactivate Account?" : "Activate Account?",
      message: willDisable
        ? `${staff.displayName || staff.email} will not be able to log in until reactivated.`
        : `${staff.displayName || staff.email} will be able to log in again.`,
      variant: willDisable ? "danger" : "primary",
      confirmLabel: willDisable ? "Deactivate" : "Activate",
      onConfirm: async () => {
        setToggling(staff.id);
        try {
          await updateDoc(doc(db, "users", staff.id), { disabled: willDisable });
        } finally {
          setToggling(null);
        }
      },
    });
  }

  function handleDelete(staff) {
    setConfirmDlg({
      title: "Remove Staff Account",
      message: `Remove ${staff.displayName || staff.email} from staff? They will no longer be able to log in.`,
      onConfirm: async () => {
        setDeleting(staff.id);
        try {
          await deleteDoc(doc(db, "users", staff.id));
        } finally {
          setDeleting(null);
        }
      },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Staff Accounts</h2>
        <button className={styles.addBtn} onClick={() => { resetForm(); setShowForm(true); }}>
          + Register Staff
        </button>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : staffList.length === 0 ? (
        <p className={styles.empty}>No staff accounts yet. Register one above.</p>
      ) : (
        <div className={styles.list}>
          {staffList.map((staff) => (
            <div key={staff.id} className={`${styles.card} ${staff.disabled ? styles.disabledCard : ""}`}>
              <div className={styles.cardInfo}>
                <div className={styles.cardName}>
                  {staff.displayName || <span className={styles.noName}>No name</span>}
                  {staff.disabled && <span className={styles.disabledBadge}>Inactive</span>}
                </div>
                <div className={styles.cardEmail}>{staff.email}</div>
              </div>
              <div className={styles.cardRight}>
                <span className={styles.roleBadge}>Staff</span>
                <button
                  className={`${styles.toggleStatusBtn} ${staff.disabled ? styles.activateBtn : styles.deactivateBtn}`}
                  onClick={() => toggleDisabled(staff)}
                  disabled={toggling === staff.id}
                >
                  {toggling === staff.id
                    ? "…"
                    : staff.disabled
                    ? "Activate"
                    : "Deactivate"}
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(staff)}
                  disabled={deleting === staff.id}
                >
                  {deleting === staff.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register modal */}
      {showForm && (
        <Modal title="Register Staff Account" onClose={() => setShowForm(false)} width="400px">
          <form className={styles.form} onSubmit={handleCreate}>
            <label className={styles.label}>
              Name <span className={styles.optional}>(optional)</span>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Karim"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
              <input
                className={styles.input}
                type="email"
                placeholder="staff@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className={styles.label}>
              Password <span className={styles.required}>*</span>
              <input
                className={styles.input}
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button className={styles.submitBtn} type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create Account"}
              </button>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
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
