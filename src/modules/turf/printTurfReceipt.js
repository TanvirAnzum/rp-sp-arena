/**
 * Opens a print popup window with a self-contained turf booking receipt.
 */
export function printTurfReceipt({
  booking,
  slotLabel,
  date,
  basePrice,
  discountAmt,
  discountType,
  discountValue,
  taxPercent,
  taxAmt,
  total,
  advance,
  remaining,
  paid,
  paymentMethod,
  issuedBy,
}) {
  const METHOD_LABELS = { cash: "Cash", card: "Card", mfs: "MFS (Mobile)", others: "Others" };
  const paidStamp = paid
    ? `<div style="display:inline-block;margin-top:6px;border:2px solid #16a34a;border-radius:4px;color:#16a34a;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px;">&#10003; PAID</div>`
    : `<div style="display:inline-block;margin-top:6px;border:2px solid #dc2626;border-radius:4px;color:#dc2626;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px;">UNPAID</div>`;
  const payMethodRow = paid && paymentMethod
    ? `<tr><td colspan="2" style="padding:2px 4px;">Payment</td><td style="padding:2px 4px;text-align:right;font-weight:600;">${METHOD_LABELS[paymentMethod] ?? paymentMethod}</td></tr>`
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

  const advanceRows =
    advance > 0
      ? `<tr style="color:#0ea5e9;">
          <td colspan="2" style="padding:2px 4px;">Advance Paid</td>
          <td style="padding:2px 4px;text-align:right;">&#8722; &#2547;${advance.toLocaleString()}</td>
         </tr>
         <tr style="font-weight:700;">
          <td colspan="2" style="padding:4px 4px;">Remaining Due</td>
          <td style="padding:4px 4px;text-align:right;">&#2547;${remaining.toLocaleString()}</td>
         </tr>`
      : "";

  const servedByRow = issuedBy
    ? `<p style="margin-top:4px;word-break:break-word;overflow-wrap:break-word;">Served by: ${issuedBy}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Turf Booking Receipt</title>
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
    .detail-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
    .detail-label { color: #555; }
    .grand { font-size: 14px; font-weight: 700; }
    @media print { body { width: 100%; } }
  </style>
</head>
<body>
  <div class="center">
    <div style="font-size:14px;font-weight:700;letter-spacing:1px;">Rangpur Sports Arena</div>
    <div style="font-size:10px;color:#555;margin-top:2px;">Turf Booking</div>
    <div style="font-size:10px;color:#555;margin-top:5px;">${date}</div>
    ${paidStamp}
  </div>

  <div class="dashed"></div>

  <div class="detail-row"><span class="detail-label">Customer</span><span>${booking.customerName ?? ""}</span></div>
  <div class="detail-row"><span class="detail-label">Phone</span><span>${booking.phone ?? ""}</span></div>
  <div class="detail-row"><span class="detail-label">Slot</span><span>${slotLabel}</span></div>
  <div class="detail-row"><span class="detail-label">Capacity</span><span>${booking.tier} players</span></div>

  <div class="dashed"></div>

  <table>
    <tr>
      <td colspan="2" style="padding:2px 4px;">Base Price (${booking.tier} players)</td>
      <td style="padding:2px 4px;text-align:right;font-weight:600;">&#2547;${basePrice.toLocaleString()}</td>
    </tr>
    ${discountRow}
    ${taxRow}
    <tr><td colspan="3"><div class="thin"></div></td></tr>
    <tr class="grand">
      <td colspan="2" style="padding:4px 4px;">TOTAL</td>
      <td style="padding:4px 4px;text-align:right;">&#2547;${total.toLocaleString()}</td>
    </tr>
    ${advanceRows}
    ${payMethodRow}
  </table>

  <div class="dashed"></div>

  <div class="center" style="color:#555;font-size:10px;">
    <p>Thank you for booking!</p>
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
