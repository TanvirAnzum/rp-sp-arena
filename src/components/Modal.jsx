import { useEffect } from "react";
import styles from "./Modal.module.css";

/**
 * Generic modal overlay.
 * Props:
 *   title              — header text
 *   onClose            — called when ✕ is clicked (or overlay, unless disabled)
 *   children           — modal body
 *   width              — optional max-width (default 500px)
 *   disableOverlayClose — if true, clicking the backdrop does NOT close the modal
 */
export default function Modal({ title, onClose, children, width = "500px", disableOverlayClose = false }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={disableOverlayClose ? undefined : onClose}
    >
      <div
        className={styles.modal}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
