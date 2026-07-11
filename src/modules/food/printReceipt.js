/**
 * Opens a dedicated print window with the receipt content.
 * Completely self-contained: no CSS modules, no portal, no modal clipping.
 */
export function printReceipt({ sale, paid, paymentMethod, issuedBy }) {
  const {
    items = [],
    subtotal = 0,
    discountAmt = 0,
    discountType,
    discountValue,
    taxPercent = 0,
    taxAmt = 0,
    total = 0,
    tokenNumber,
    receiptDate,
  } = sale;

  const tokenLabel = tokenNumber != null
    ? `TOKEN #${String(tokenNumber).padStart(3, "0")}`
    : "";

  const METHOD_LABELS = { cash: "Cash", card: "Card", mfs: "MFS (Mobile)", others: "Others" };
  const paidStamp = paid
    ? `<div style="display:inline-block;margin-top:6px;border:2px solid #16a34a;border-radius:4px;color:#16a34a;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px;">&#10003; PAID</div>`
    : `<div style="display:inline-block;margin-top:6px;border:2px solid #dc2626;border-radius:4px;color:#dc2626;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px;">UNPAID</div>`;
  const payMethodRow = paid && paymentMethod
    ? `<tr><td colspan="3" style="padding:2px 4px;color:#555;">Payment</td><td style="padding:2px 4px;text-align:right;font-weight:600;">${METHOD_LABELS[paymentMethod] ?? paymentMethod}</td></tr>`
    : "";

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:2px 4px;">${item.name}</td>
      <td style="padding:2px 4px;text-align:center;">${item.quantity}</td>
      <td style="padding:2px 4px;text-align:right;">&#2547;${(item.price ?? 0).toLocaleString()}</td>
      <td style="padding:2px 4px;text-align:right;font-weight:600;">&#2547;${(item.subtotal ?? 0).toLocaleString()}</td>
    </tr>
  `).join("");

  const discountRow = discountAmt > 0 ? `
    <tr style="color:#16a34a;">
      <td colspan="3" style="padding:2px 4px;">Discount${discountType === "percent" ? ` (${discountValue}%)` : " (Fixed)"}</td>
      <td style="padding:2px 4px;text-align:right;">&#8722; &#2547;${discountAmt.toLocaleString()}</td>
    </tr>
  ` : "";

  const taxRow = taxAmt > 0 ? `
    <tr>
      <td colspan="3" style="padding:2px 4px;">Tax (${taxPercent}%)</td>
      <td style="padding:2px 4px;text-align:right;">+ &#2547;${taxAmt.toLocaleString()}</td>
    </tr>
  ` : "";

  const servedByRow = issuedBy
    ? `<p style="margin-top:4px;word-break:break-word;overflow-wrap:break-word;">Served by: ${issuedBy}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #111;
      background: #fff;
      padding: 16px;
      max-width: 320px;
      margin: 0 auto;
    }
    .header { text-align: center; margin-bottom: 8px; }
    .arena-name { font-size: 15px; font-weight: 700; letter-spacing: 1px; }
    .tagline { font-size: 10px; color: #555; margin-top: 2px; }
    .token {
      display: inline-block;
      background: #1e293b;
      color: #fff;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-top: 6px;
      padding: 3px 10px;
    }
    .datetime { font-size: 10px; color: #555; margin-top: 6px; }
    .dashed { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
    .thin   { border: none; border-top: 1px solid #ddd; margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead th { color: #555; font-size: 10px; text-transform: uppercase; text-align: left; padding: 2px 4px; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    .total-row td { padding: 2px 4px; font-size: 12px; }
    .grand td { font-size: 14px; font-weight: 700; letter-spacing: 1px; }
    .footer { text-align: center; color: #555; font-size: 10px; margin-top: 4px; }
    .footer p { margin: 2px 0; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="arena-name">Rangpur Sports Arena</div>
    <div class="tagline">Your game, our arena.</div>
    ${tokenLabel ? `<div class="token">${tokenLabel}</div><br/>` : ""}
    <div class="datetime">${receiptDate ?? ""}</div>
    ${paidStamp}
  </div>

  <div class="dashed"></div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr><td colspan="4"><div class="thin"></div></td></tr>
      ${itemRows}
    </tbody>
  </table>

  <div class="dashed"></div>

  <table>
    <tbody>
      <tr class="total-row">
        <td colspan="3">Subtotal</td>
        <td style="text-align:right;">&#2547;${subtotal.toLocaleString()}</td>
      </tr>
      ${discountRow}
      ${taxRow}
      <tr><td colspan="4"><div class="thin"></div></td></tr>
      <tr class="total-row grand">
        <td colspan="3">TOTAL</td>
        <td style="text-align:right;">&#2547;${total.toLocaleString()}</td>
      </tr>
      ${payMethodRow}
    </tbody>
  </table>

  <div class="dashed"></div>

  <div class="footer">
    <p>Thank you for visiting!</p>
    <p>Rangpur Sports Arena</p>
    ${servedByRow}
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=420,height=680");
  if (!win) {
    alert("Popups are blocked. Please allow popups for this site and try again.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
