export function toDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatDateLabel(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Add or increment a product in the cart */
export function addToCart(cart, product) {
  const existing = cart.find((i) => i.productId === product.id);
  if (existing) {
    return cart.map((i) =>
      i.productId === product.id
        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
        : i
    );
  }
  return [
    ...cart,
    {
      productId: product.id,
      name: product.name,
      price: product.price,
      category: product.category ?? "",
      quantity: 1,
      subtotal: product.price,
    },
  ];
}

/** Change quantity of a cart item; removes if quantity reaches 0 */
export function setCartQty(cart, productId, qty) {
  if (qty <= 0) return cart.filter((i) => i.productId !== productId);
  return cart.map((i) =>
    i.productId === productId ? { ...i, quantity: qty, subtotal: qty * i.price } : i
  );
}

export function cartTotal(cart) {
  return cart.reduce((sum, i) => sum + i.subtotal, 0);
}

/** Format a Date object into a readable receipt timestamp */
export function formatReceiptDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Compute subtotal, discount, tax and grand total from cart + settings.
 * Returns { subtotal, discountAmt, taxAmt, total }
 */
export function calcBreakdown(cart, discountType, discountValue, taxPercent) {
  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);

  const discVal = Math.max(0, parseFloat(discountValue) || 0);
  let discountAmt = 0;
  if (discVal > 0) {
    discountAmt =
      discountType === "percent"
        ? Math.round((subtotal * Math.min(discVal, 100)) / 100)
        : Math.min(discVal, subtotal);
  }

  const afterDiscount = subtotal - discountAmt;
  const taxPct = Math.max(0, Math.min(100, parseFloat(taxPercent) || 0));
  const taxAmt = taxPct > 0 ? Math.round((afterDiscount * taxPct) / 100) : 0;

  const total = afterDiscount + taxAmt;
  return { subtotal, discountAmt, taxAmt, total };
}
