import { useEffect } from "react";
import styles from "./ConfirmDialog.module.css";

/**
 * Custom confirmation dialog — replaces window.confirm().
 * Clicking the dark overlay does NOT dismiss the dialog.
 * Only the Cancel button or Escape key dismiss it.
 */
export default function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  variant = "primary",
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        {title && <div className={styles.title}>{title}</div>}
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmBtn} ${variant === "danger" ? styles.danger : styles.primary}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
