/**
 * Opens a print popup window with a self-contained swimming token receipt.
 */
export function printSwimmingReceipt({
  token,
  subtotal,
  discountAmt,
  discountType,
  discountValue,
  taxPercent,
  taxAmt,
  total,
  paid,
  paymentMethod,
  exitTime,
  overtime,
  issuedBy,
}) {
  const tokenLabel =
    token.tokenNumber != null
      ? `TOKEN #${String(token.tokenNumber).padStart(3, "0")}`
      : `SW-${token.id.slice(0, 6).toUpperCase()}`;

  const entryTime = (() => {
    if (!token.entryTime) return "";
    const d = token.entryTime.toDate ? token.entryTime.toDate() : new Date(token.entryTime);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  })();
  const exitTimeStr = (() => {
    if (!exitTime) return "";
    const d = exitTime.toDate ? exitTime.toDate() : new Date(exitTime);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  })();
  const overtimeRow = overtime > 0
    ? `<div style="color:#dc2626;font-size:10px;margin-top:3px;">&#9888; Overtime: +${overtime} min</div>`
    : "";

  const METHOD_LABELS = { cash: "Cash", card: "Card", mfs: "MFS (Mobile)", others: "Others" };
  const paidStamp = paid
    ? `<div style="display:inline-block;margin-top:6px;border:2px solid #16a34a;border-radius:4px;color:#16a34a;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px;">&#10003; PAID</div>`
    : `<div style="display:inline-block;margin-top:6px;border:2px solid #dc2626;border-radius:4px;color:#dc2626;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px;">UNPAID</div>`;
  const payMethodRow = paid && paymentMethod
    ? `<tr><td style="padding:2px 4px;" colspan="2">Payment</td><td style="padding:2px 4px;text-align:right;font-weight:600;">${METHOD_LABELS[paymentMethod] ?? paymentMethod}</td></tr>`
    : "";

  const discountRow =
    discountAmt > 0
      ? `<tr style="color:#16a34a;">
          <td style="padding:2px 4px;" colspan="2">Discount${discountType === "percent" ? ` (${discountValue}%)` : " (Fixed)"}</td>
          <td style="padding:2px 4px;text-align:right;">&#8722; &#2547;${discountAmt.toLocaleString()}</td>
         </tr>`
      : "";

  const taxRow =
    taxAmt > 0
      ? `<tr>
          <td style="padding:2px 4px;" colspan="2">VAT/Tax (${taxPercent}%)</td>
          <td style="padding:2px 4px;text-align:right;">+ &#2547;${taxAmt.toLocaleString()}</td>
         </tr>`
      : "";

  const servedByRow = issuedBy
    ? `<p style="margin-top:4px;word-break:break-word;overflow-wrap:break-word;">Served by: ${issuedBy}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Swimming Receipt</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #fff;
      color: #111;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      padding: 12px;
      width: 300px;
    }
    .center { text-align: center; }
    .dashed { border: none; border-top: 1px dashed #999; margin: 8px 0; }
    .thin   { border: none; border-top: 1px solid #ddd; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    .grand { font-size: 14px; font-weight: 700; }
    @media print { body { width: 100%; } }
  </style>
</head>
<body>
  <div class="center">
    <div style="font-size:14px;font-weight:700;letter-spacing:1px;">Rangpur Sports Arena</div>
    <div style="font-size:10px;color:#555;margin-top:2px;">Swimming Pool</div>
    <div style="display:inline-block;background:#1e293b;color:#fff;font-weight:700;font-size:12px;
                letter-spacing:2px;margin-top:6px;padding:3px 10px;border-radius:4px;">${tokenLabel}</div>
    <div style="font-size:10px;color:#555;margin-top:5px;">${token.date} &nbsp;|&nbsp; In: ${entryTime}${exitTimeStr ? " &nbsp;&#183;&nbsp; Out: " + exitTimeStr : ""}</div>
    ${overtimeRow}
    ${paidStamp}
  </div>

  <div class="dashed"></div>

  <table>
    <tr style="color:#555;font-size:10px;">
      <th style="text-align:left;padding:2px 4px;">Item</th>
      <th style="text-align:center;padding:2px 4px;">Qty</th>
      <th style="text-align:right;padding:2px 4px;">Amount</th>
    </tr>
    <tr><td colspan="3"><div class="thin"></div></td></tr>
    <tr>
      <td style="padding:2px 4px;">Swimming (${token.people} pax x ${token.hours} hr)</td>
      <td style="padding:2px 4px;text-align:center;">1</td>
      <td style="padding:2px 4px;text-align:right;font-weight:600;">&#2547;${subtotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding:2px 4px;color:#555;font-size:10px;">Rate: &#2547;${(token.pricePerPersonPerHour ?? 0).toLocaleString()} / person / hr</td>
      <td></td><td></td>
    </tr>
  </table>

  <div class="dashed"></div>

  <table>
    <tr>
      <td colspan="2" style="padding:2px 4px;">Subtotal</td>
      <td style="padding:2px 4px;text-align:right;">&#2547;${subtotal.toLocaleString()}</td>
    </tr>
    ${discountRow}
    ${taxRow}
    <tr><td colspan="3"><div class="thin"></div></td></tr>
    <tr class="grand">
      <td colspan="2" style="padding:4px 4px;">TOTAL</td>
      <td style="padding:4px 4px;text-align:right;">&#2547;${total.toLocaleString()}</td>
    </tr>
    ${payMethodRow}
  </table>

  <div class="dashed"></div>

  <div class="center" style="color:#555;font-size:10px;">
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

  const win = window.open("", "_blank", "width=420,height=620");
  if (!win) {
    alert("Popups are blocked. Please allow popups for this site and try again.");
    return;
  }
  win.document.write(html);
  win.document.close();
}
