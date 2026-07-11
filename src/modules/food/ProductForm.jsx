import { useState } from "react";
import styles from "./ProductForm.module.css";

export default function ProductForm({ initial, onSubmit, onCancel, saving }) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [price, setPrice]       = useState(initial?.price ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [stock, setStock]       = useState(
    initial?.stock != null ? String(initial.stock) : ""
  );
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError("Product name is required.");
    if (!price || Number(price) <= 0) return setError("Enter a valid price.");
    setError("");
    onSubmit({
      name: name.trim(),
      price: Number(price),
      category: category.trim(),
      isActive: initial?.isActive ?? true,
      // stock: null means "not tracked"; undefined is converted to null for Firestore
      stock: stock !== "" ? Number(stock) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label>Product Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Water Bottle"
          required
          autoFocus
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Price (৳)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 20"
            required
          />
        </div>
        <div className={styles.field}>
          <label>Category (optional)</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. drinks"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label>
          Stock Count{" "}
          <span style={{ color: "#64748b", fontWeight: 400, fontSize: "0.8rem" }}>
            (optional — leave blank to not track)
          </span>
        </label>
        <input
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="e.g. 50"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving…" : initial ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}
