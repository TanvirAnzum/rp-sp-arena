import { useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useSlots } from "./hooks/useSlots";
import SlotForm from "./SlotForm";
import Modal from "../../components/Modal";
import { formatTime, TIERS } from "./turf.utils";
import ConfirmDialog from "../../components/ConfirmDialog";
import styles from "./ManageSlots.module.css";

export default function ManageSlots() {
  const { slots, loading } = useSlots();
  // modal: null | "add" | { id, slot } for editing
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);

  async function handleAdd(data) {
    setSaving(true);
    try {
      await addDoc(collection(db, "turfSlots"), data);
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id, data) {
    setSaving(true);
    try {
      await updateDoc(doc(db, "turfSlots", id), data);
      setModal(null);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(slot) {
    await updateDoc(doc(db, "turfSlots", slot.id), { isActive: !slot.isActive });
  }

  function handleDelete(id) {
    setConfirmDlg({
      title: "Delete Slot",
      message: "Delete this slot? This cannot be undone.",
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteDoc(doc(db, "turfSlots", id));
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.heading}>Manage Slots</h3>
        <button className={styles.addBtn} onClick={() => setModal("add")}>
          + Add Slot
        </button>
      </div>

      {/* Slot list */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : slots.length === 0 ? (
        <p className={styles.empty}>No slots yet. Click "Add Slot" to get started.</p>
      ) : (
        <div className={styles.list}>
          {slots.map((slot) => (
            <div key={slot.id} className={`${styles.slotRow} ${!slot.isActive ? styles.inactive : ""}`}>
              <div className={styles.slotInfo}>
                <span className={styles.slotTime}>
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </span>
                <div className={styles.priceTags}>
                  {TIERS.map((t) =>
                    slot.prices?.[t] > 0 ? (
                      <span key={t} className={styles.priceTag}>
                        {t}p: ৳{slot.prices[t].toLocaleString()}
                      </span>
                    ) : null
                  )}
                </div>
              </div>

              <div className={styles.slotActions}>
                <button
                  className={`${styles.toggleBtn} ${slot.isActive ? styles.activeToggle : styles.inactiveToggle}`}
                  onClick={() => toggleActive(slot)}
                  title={slot.isActive ? "Deactivate" : "Activate"}
                >
                  {slot.isActive ? "Active" : "Inactive"}
                </button>
                <button className={styles.editBtn} onClick={() => setModal({ id: slot.id, slot })}>
                  Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(slot.id)}
                  disabled={deletingId === slot.id}
                >
                  {deletingId === slot.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      {modal === "add" && (
        <Modal title="Add New Slot" onClose={() => setModal(null)}>
          <SlotForm
            onSubmit={handleAdd}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {modal?.id && (
        <Modal title="Edit Slot" onClose={() => setModal(null)}>
          <SlotForm
            initial={modal.slot}
            onSubmit={(data) => handleEdit(modal.id, data)}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    {confirmDlg && (
        <ConfirmDialog
          title={confirmDlg.title}
          message={confirmDlg.message}
          variant="danger"
          confirmLabel="Delete"
          onConfirm={async () => { setConfirmDlg(null); await confirmDlg.onConfirm(); }}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
    </div>
  );
}
