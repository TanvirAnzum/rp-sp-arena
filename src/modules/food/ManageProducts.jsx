import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useProducts } from "./hooks/useProducts";
import ProductForm from "./ProductForm";
import Modal from "../../components/Modal";
import ConfirmDialog from "../../components/ConfirmDialog";
import styles from "./ManageProducts.module.css";

/**
 * @param {string} productsCol - "foodProducts" | "otherProducts"
 * @param {string} label       - "Food" | "Item"
 */
export default function ManageProducts({ productsCol, label }) {
  const { products, loading, refresh } = useProducts(productsCol);
  const [modal, setModal] = useState(null); // null | "add" | { id, product }
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDlg, setConfirmDlg] = useState(null);

  async function handleAdd(data) {
    setSaving(true);
    try {
      await addDoc(collection(db, productsCol), { ...data, createdAt: new Date() });
      setModal(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id, data) {
    setSaving(true);
    try {
      await updateDoc(doc(db, productsCol, id), data);
      setModal(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product) {
    await updateDoc(doc(db, productsCol, product.id), { isActive: !product.isActive });
    await refresh();
  }

  function handleDelete(id) {
    setConfirmDlg({
      title: "Delete Product",
      message: "Delete this product permanently? This cannot be undone.",
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteDoc(doc(db, productsCol, id));
          await refresh();
        } finally {
          setDeletingId(null);
        }
      },
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h3 className={styles.heading}>Manage {label} Products</h3>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={refresh} disabled={loading} title="Refresh product list">
            {loading ? "…" : "↻ Refresh"}
          </button>
          <button className={styles.addBtn} onClick={() => setModal("add")}>
            + Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : products.length === 0 ? (
        <p className={styles.empty}>No products yet. Add your first one above.</p>
      ) : (
        <div className={styles.list}>
          {products.map((p) => (
            <div key={p.id} className={`${styles.row} ${!p.isActive ? styles.inactive : ""}`}>
              <div className={styles.info}>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.meta}>
                  ৳{p.price?.toLocaleString()}
                  {p.category && <> &nbsp;·&nbsp; {p.category}</>}
                  {p.stock != null && (
                    <span className={p.stock <= 5 ? styles.lowStock : styles.stockBadge}>
                      &nbsp;·&nbsp; Stock: {p.stock}
                      {p.stock <= 5 && " ⚠"}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  className={`${styles.toggleBtn} ${p.isActive ? styles.activeToggle : styles.inactiveToggle}`}
                  onClick={() => toggleActive(p)}
                >
                  {p.isActive ? "Active" : "Inactive"}
                </button>
                <button className={styles.editBtn} onClick={() => setModal({ id: p.id, product: p })}>
                  Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "add" && (
        <Modal title={`Add ${label} Product`} onClose={() => setModal(null)}>
          <ProductForm onSubmit={handleAdd} onCancel={() => setModal(null)} saving={saving} />
        </Modal>
      )}

      {modal?.id && (
        <Modal title={`Edit ${label} Product`} onClose={() => setModal(null)}>
          <ProductForm
            initial={modal.product}
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
