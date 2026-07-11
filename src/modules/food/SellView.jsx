import { useState, useEffect, useRef } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../auth/AuthContext";
import { useProducts } from "./hooks/useProducts";
import { getNextToken } from "../../firebase/tokenCounter";
import Modal from "../../components/Modal";
import Receipt from "./Receipt";
import {
  addToCart, setCartQty,
  calcBreakdown, toDateStr, formatReceiptDate,
} from "./pos.utils";
import PaymentMethodPicker from "../../components/PaymentMethodPicker";
import styles from "./SellView.module.css";

export default function SellView({ productsCol, salesCol, moduleKey }) {
  const { user } = useAuth();
  const { products, loading } = useProducts(productsCol);

  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [taxPercent, setTaxPercent] = useState("");
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showConfirm, setShowConfirm] = useState(false);
  const [payMethod, setPayMethod] = useState("cash");
  const [payTxId, setPayTxId] = useState("");
  const [payNote, setPayNote] = useState("");
  const [cartError, setCartError] = useState("");
  const cartErrorTimer = useRef(null);

  // Clear pending cartError timer on unmount
  useEffect(() => () => { if (cartErrorTimer.current) clearTimeout(cartErrorTimer.current); }, []);

  // Derive ordered category list from products (frontend only, no DB)
  const categories = ["All", ...Array.from(
    new Set(products.filter((p) => p.isActive && p.category).map((p) => p.category))
  ).sort()];

  const activeProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (search) return p.name.toLowerCase().includes(search.toLowerCase());
    if (activeCategory === "All") return true;
    return p.category === activeCategory;
  });

  const { subtotal, discountAmt, taxAmt, total } = calcBreakdown(
    cart, discountType, discountValue, taxPercent
  );

  function handleAdd(product) {
    if (product.stock === 0) {
      setCartError(`"${product.name}" is out of stock.`);
      if (cartErrorTimer.current) clearTimeout(cartErrorTimer.current);
      cartErrorTimer.current = setTimeout(() => setCartError(""), 3000);
      return;
    }
    setCartError("");
    setCart((c) => addToCart(c, product));
  }
  function handleQtyChange(productId, qty) { setCart((c) => setCartQty(c, productId, qty)); }
  function clearCart() {
    setCart([]);
    setDiscountValue("");
    setTaxPercent("");
    setPayMethod("cash");
    setPayTxId("");
    setPayNote("");
    setSearch("");
    setActiveCategory("All");
  }

  async function confirmSale() {
    setShowConfirm(false);
    setSaving(true);
    const now = new Date();
    const dateStr = toDateStr(now);
    try {
      const tokenNumber = await getNextToken(db, dateStr, moduleKey || salesCol);
      const saleDoc = {
        items: cart,
        subtotal,
        discountType,
        discountValue: Number(discountValue) || 0,
        discountAmt,
        taxPercent: Number(taxPercent) || 0,
        taxAmt,
        total,
        tokenNumber,
        paid: true,
        paymentMethod: payMethod,
        paymentTxId: payTxId.trim() || null,
        paymentNote: payNote.trim() || null,
        date: dateStr,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      };
      const docRef = await addDoc(collection(db, salesCol), saleDoc);
      setReceipt({
        ...saleDoc,
        id: docRef.id,
        receiptDate: formatReceiptDate(now),
      });
      clearCart();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.posLayout}>
      {/* Left: product picker */}
      <div className={styles.picker}>
        <input
          className={styles.search}
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setActiveCategory("All"); }}
        />
        {cartError && <p className={styles.cartError}>{cartError}</p>}

        {/* Category tabs - hidden while searching */}
        {!search && !loading && categories.length > 1 && (
          <div className={styles.catTabs}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.catTab} ${activeCategory === cat ? styles.catTabActive : ""}`}
                onClick={() => setActiveCategory(cat)}
                type="button"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : activeProducts.length === 0 ? (
          <p className={styles.empty}>
            {search ? "No products match your search." : "No active products. Ask the owner to add products."}
          </p>
        ) : (
          <div className={styles.grid}>
            {activeProducts.map((p) => {
              const inCart = cart.find((i) => i.productId === p.id);
              return (
                <button
                  key={p.id}
                  className={`${styles.productCard} ${inCart ? styles.inCart : ""}`}
                  onClick={() => handleAdd(p)}
                >
                  {inCart && <span className={styles.qtyBadge}>{inCart.quantity}</span>}
                  {p.stock != null && p.stock <= 5 && (
                    <span className={styles.lowStockBadge}>
                      {p.stock === 0 ? "Out of stock" : `Low: ${p.stock} left`}
                    </span>
                  )}
                  <span className={styles.productName}>{p.name}</span>
                  {p.category && <span className={styles.productCat}>{p.category}</span>}
                  <span className={styles.productPrice}>&#2547;{p.price?.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: cart */}
      <div className={styles.cart}>
        <h3 className={styles.cartTitle}>Current Bill</h3>
        {cart.length === 0 ? (
          <p className={styles.cartEmpty}>Tap a product to add it here.</p>
        ) : (
          <>
            <div className={styles.cartItems}>
              {cart.map((item) => (
                <div key={item.productId} className={styles.cartRow}>
                  <div className={styles.cartInfo}>
                    <span className={styles.cartName}>{item.name}</span>
                    <span className={styles.cartUnit}>&#2547;{item.price?.toLocaleString()} each</span>
                  </div>
                  <div className={styles.qtyControl}>
                    <button className={styles.qtyBtn} onClick={() => handleQtyChange(item.productId, item.quantity - 1)}>-</button>
                    <span className={styles.qtyVal}>{item.quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => handleQtyChange(item.productId, item.quantity + 1)}>+</button>
                  </div>
                  <span className={styles.cartSubtotal}>&#2547;{item.subtotal?.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className={styles.divider} />
            <div className={styles.lineRow}>
              <span>Subtotal</span><span>&#2547;{subtotal.toLocaleString()}</span>
            </div>
            <div className={styles.adjustRow}>
              <span className={styles.adjustLabel}>Discount</span>
              <div className={styles.adjustInputs}>
                <button className={`${styles.typeToggle} ${discountType === "percent" ? styles.typeActive : ""}`} onClick={() => setDiscountType("percent")} type="button">%</button>
                <button className={`${styles.typeToggle} ${discountType === "fixed" ? styles.typeActive : ""}`} onClick={() => setDiscountType("fixed")} type="button">&#2547;</button>
                <input className={styles.adjustInput} type="number" min="0" placeholder="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
              </div>
              {discountAmt > 0 && <span className={styles.discountAmt}>- &#2547;{discountAmt.toLocaleString()}</span>}
            </div>
            <div className={styles.adjustRow}>
              <span className={styles.adjustLabel}>Tax (%)</span>
              <div className={styles.adjustInputs}>
                <input className={styles.adjustInput} type="number" min="0" max="100" placeholder="0" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
              </div>
              {taxAmt > 0 && <span className={styles.taxAmt}>+ &#2547;{taxAmt.toLocaleString()}</span>}
            </div>
            <div className={styles.divider} />
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong className={styles.totalAmt}>&#2547;{total.toLocaleString()}</strong>
            </div>
            <button className={styles.saleBtn} onClick={() => setShowConfirm(true)} disabled={saving}>
              {saving ? "Saving..." : "Complete Sale & Get Receipt"}
            </button>
            <button className={styles.clearBtn} onClick={clearCart} disabled={saving}>Clear</button>
          </>
        )}
      </div>

      {/* Confirm sale modal */}
      {showConfirm && (
        <Modal title="Confirm Sale" onClose={() => setShowConfirm(false)} width="320px" disableOverlayClose>
          <div className={styles.confirmBody}>
            <p className={styles.confirmText}>Review your sale before saving:</p>
            <div className={styles.confirmItems}>
              {cart.map((item) => (
                <div key={item.productId} className={styles.confirmRow}>
                  <span>{item.name} x {item.quantity}</span>
                  <span>&#2547;{item.subtotal?.toLocaleString()}</span>
                </div>
              ))}
            </div>
            {discountAmt > 0 && (
              <div className={styles.confirmRow}>
                <span>Discount</span>
                <span style={{ color: "#22c55e" }}>- &#2547;{discountAmt.toLocaleString()}</span>
              </div>
            )}
            {taxAmt > 0 && (
              <div className={styles.confirmRow}>
                <span>Tax</span>
                <span style={{ color: "#f59e0b" }}>+ &#2547;{taxAmt.toLocaleString()}</span>
              </div>
            )}
            <div className={styles.confirmTotal}>
              <span>Total</span>
              <strong>&#2547;{total.toLocaleString()}</strong>
            </div>
            <PaymentMethodPicker
              value={payMethod}
              onChange={setPayMethod}
              txId={payTxId}
              onTxIdChange={setPayTxId}
              note={payNote}
              onNoteChange={setPayNote}
              compact
            />
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={confirmSale}
                disabled={saving}
              >
                {saving ? "Saving..." : "Confirm Sale"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receipt modal */}
      {receipt && (
        <Modal
          title={receipt.tokenNumber != null ? `Receipt - TOKEN #${String(receipt.tokenNumber).padStart(3, "0")}` : "Receipt"}
          onClose={() => setReceipt(null)}
          width="400px"
        >
          <Receipt
            sale={receipt}
            salesCol={salesCol}
            onClose={() => setReceipt(null)}
          />
        </Modal>
      )}
    </div>
  );
}
