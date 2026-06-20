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
import { formatTime, TIERS } from "./turf.utils";
import styles from "./ManageSlots.module.css";

export default function ManageSlots() {
  const { slots, loading } = useSlots();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleAdd(data) {
    setSaving(true);
    try {
      await addDoc(collection(db, "turfSlots"), data);
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id, data) {
    setSaving(true);
    try {
      await updateDoc(doc(db, "turfSlots", id), data);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(slot) {
    await updateDoc(doc(db, "turfSlots", slot.id), { isActive: !slot.isActive });
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this slot? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "turfSlots", id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.heading}>Manage Slots</h3>
        <button className={styles.addBtn} onClick={() => { setShowAdd(true); setEditingId(null); }}>
          + Add Slot
        </button>
      </div>

      {/* Add slot form */}
      {showAdd && (
        <div className={styles.formCard}>
          <h4 className={styles.formTitle}>New Slot</h4>
          <SlotForm
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Slot list */}
      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : slots.length === 0 ? (
        <p className={styles.empty}>No slots yet. Add your first slot above.</p>
      ) : (
        <div className={styles.list}>
          {slots.map((slot) => (
            <div key={slot.id} className={`${styles.slotRow} ${!slot.isActive ? styles.inactive : ""}`}>
              {editingId === slot.id ? (
                <div className={styles.editBlock}>
                  <SlotForm
                    initial={slot}
                    onSubmit={(data) => handleEdit(slot.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <>
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
                    <button className={styles.editBtn} onClick={() => { setEditingId(slot.id); setShowAdd(false); }}>
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
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
