/**
 * Full A4 daily summary — all transactions in tables, suitable for PDF.
 */
export function printDaySummary({ date, dateLabel, generatedBy, data, records, expenses, expenseTotal }) {
  const revenue     = data?.total       ?? 0;
  const collected   = data?.paidTotal   ?? 0;
  const outstanding = data?.unpaidTotal ?? 0;
  const net         = revenue - expenseTotal;

  const METHOD = { cash: "Cash", card: "Card", mfs: "MFS", others: "Others" };
  const fmt  = (n) => "৳" + (n ?? 0).toLocaleString();
  const paid = (flag) => flag
    ? `<span style="color:#16a34a;font-weight:600;">Paid</span>`
    : `<span style="color:#dc2626;">Unpaid</span>`;

  /* ── TURF TABLE ── */
  const turfRows = (records?.turf ?? []).map((r, i) => `
    <tr class="${i % 2 ? "alt" : ""}">
      <td>${r.customerName ?? ""}</td>
      <td>${r.phone ?? ""}</td>
      <td>${r.slotLabel ?? ""}</td>
      <td class="c">${r.tier ?? ""}</td>
      <td class="r">${fmt(r.finalTotal ?? r.price)}</td>
      <td class="r">${r.advancePaid ? fmt(r.advancePaid) : "—"}</td>
      <td class="c">${r.paymentMethod ? METHOD[r.paymentMethod] ?? r.paymentMethod : "—"}</td>
      <td class="c">${r.advancePaid > 0 ? `<span style="color:#0ea5e9;font-weight:600;">Advance</span>` : paid(r.paid)}</td>
    </tr>`).join("") || `<tr><td colspan="8" class="empty">No turf bookings</td></tr>`;

  const turfTotal = (records?.turf ?? []).reduce((s, r) => s + (r.finalTotal ?? r.price ?? 0), 0);

  /* ── SWIMMING TABLE ── */
  const swimRows = (records?.swim ?? []).map((r, i) => `
    <tr class="${i % 2 ? "alt" : ""}">
      <td class="c">${r.tokenNumber != null ? "#" + String(r.tokenNumber).padStart(3,"0") : "—"}</td>
      <td class="c">${r.people ?? ""}</td>
      <td class="c">${r.hours ?? "active"}</td>
      <td class="r">${fmt(r.pricePerPersonPerHour)}/hr</td>
      <td class="r">${fmt(r.finalTotal ?? r.totalPrice)}</td>
      <td class="c">${r._entryStr ?? ""}</td>
      <td class="c">${r._exitStr  ?? "—"}</td>
      <td class="c">${r.paymentMethod ? METHOD[r.paymentMethod] ?? r.paymentMethod : "—"}</td>
      <td class="c">${paid(r.paid)}</td>
    </tr>`).join("") || `<tr><td colspan="9" class="empty">No swimming sessions</td></tr>`;

  const swimTotal = (records?.swim ?? []).reduce((s, r) => s + (r.finalTotal ?? r.totalPrice ?? 0), 0);

  /* ── FOOD TABLE ── */
  function itemsSummary(items = []) {
    return items.map(it => `${it.name} ×${it.quantity}`).join(", ");
  }

  const foodRows = (records?.food ?? []).map((r, i) => `
    <tr class="${i % 2 ? "alt" : ""}">
      <td class="c">${r.tokenNumber != null ? "#" + String(r.tokenNumber).padStart(3,"0") : "—"}</td>
      <td class="items">${itemsSummary(r.items)}</td>
      <td class="r">${fmt(r.subtotal)}</td>
      <td class="r">${r.discountAmt > 0 ? fmt(r.discountAmt) : "—"}</td>
      <td class="r">${fmt(r.total)}</td>
      <td class="c">${r.paymentMethod ? METHOD[r.paymentMethod] ?? r.paymentMethod : "—"}</td>
      <td class="c">${paid(r.paid)}</td>
    </tr>`).join("") || `<tr><td colspan="7" class="empty">No food sales</td></tr>`;

  const foodTotal = (records?.food ?? []).reduce((s, r) => s + (r.total ?? 0), 0);

  /* ── OTHER ITEMS TABLE ── */
  const otherRows = (records?.other ?? []).map((r, i) => `
    <tr class="${i % 2 ? "alt" : ""}">
      <td class="c">${r.tokenNumber != null ? "#" + String(r.tokenNumber).padStart(3,"0") : "—"}</td>
      <td class="items">${itemsSummary(r.items)}</td>
      <td class="r">${fmt(r.subtotal)}</td>
      <td class="r">${r.discountAmt > 0 ? fmt(r.discountAmt) : "—"}</td>
      <td class="r">${fmt(r.total)}</td>
      <td class="c">${r.paymentMethod ? METHOD[r.paymentMethod] ?? r.paymentMethod : "—"}</td>
      <td class="c">${paid(r.paid)}</td>
    </tr>`).join("") || `<tr><td colspan="7" class="empty">No other item sales</td></tr>`;

  const otherTotal = (records?.other ?? []).reduce((s, r) => s + (r.total ?? 0), 0);

  /* ── EXPENSES TABLE ── */
  const expenseRows = expenses.length === 0
    ? `<tr><td colspan="2" class="empty">No expenses recorded</td></tr>`
    : expenses.map((e, i) => `
        <tr class="${i % 2 ? "alt" : ""}">
          <td>${e.note ?? ""}</td>
          <td class="r" style="color:#dc2626;font-weight:600;">${fmt(e.amount)}</td>
        </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Daily Summary — ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #111;
      background: #fff;
      padding: 20px 28px;
    }
    /* ── Header ── */
    .hdr { border-bottom: 2px solid #0ea5e9; margin-bottom: 14px; padding-bottom: 10px; }
    .hdr-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .arena   { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
    .sub     { color: #555; font-size: 10px; margin-top: 2px; }
    .hdr-right { text-align: right; color: #555; font-size: 10px; line-height: 1.6; }
    .date-label { font-size: 14px; font-weight: 700; color: #111; }

    /* ── Summary bar ── */
    .summary-bar {
      display: flex; gap: 0; margin-bottom: 16px;
      border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;
    }
    .sum-cell {
      flex: 1; padding: 8px 12px; text-align: center; border-right: 1px solid #e2e8f0;
    }
    .sum-cell:last-child { border-right: none; }
    .sum-label { color: #555; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
    .sum-val   { font-size: 14px; font-weight: 700; margin-top: 2px; }
    .green { color: #16a34a; }
    .amber { color: #d97706; }
    .red   { color: #dc2626; }
    .blue  { color: #0ea5e9; }

    /* ── Section ── */
    .section { margin-bottom: 16px; }
    .sec-title {
      background: #f1f5f9;
      border-left: 3px solid #0ea5e9;
      color: #1e293b;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      padding: 4px 8px;
      text-transform: uppercase;
      margin-bottom: 0;
    }

    /* ── Tables ── */
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th {
      background: #f8fafc;
      border-bottom: 1px solid #cbd5e1;
      color: #475569;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.4px;
      padding: 4px 6px;
      text-align: left;
      text-transform: uppercase;
    }
    td { padding: 4px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr.alt td { background: #fafafa; }
    .c { text-align: center; }
    .r { text-align: right; }
    .items { color: #334155; max-width: 220px; word-break: break-word; }
    .empty { color: #94a3b8; font-style: italic; padding: 6px; text-align: center; }
    .subtotal td {
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
      font-weight: 700;
      font-size: 10px;
    }

    /* ── Net box ── */
    .net-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      display: flex;
      gap: 0;
      margin-top: 4px;
      overflow: hidden;
    }
    .net-cell {
      flex: 1; padding: 8px 12px; text-align: center;
      border-right: 1px solid #e2e8f0;
    }
    .net-cell:last-child { border-right: none; }
    .net-label { color: #555; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
    .net-val   { font-size: 15px; font-weight: 700; margin-top: 2px; }

    /* ── Footer ── */
    .footer {
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 9px;
      margin-top: 16px;
      padding-top: 6px;
      text-align: center;
    }

    @media print {
      body { padding: 10px 16px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="hdr">
    <div class="hdr-top">
      <div>
        <div class="arena">Rangpur Sports Arena</div>
        <div class="sub">Daily Operations Summary</div>
      </div>
      <div class="hdr-right">
        <div class="date-label">${dateLabel}</div>
        <div>Generated by: <strong>${generatedBy}</strong></div>
        <div>Printed: ${new Date().toLocaleString("en-GB")}</div>
      </div>
    </div>
  </div>

  <!-- Summary bar -->
  <div class="summary-bar">
    <div class="sum-cell">
      <div class="sum-label">Total Revenue</div>
      <div class="sum-val blue">${fmt(revenue)}</div>
    </div>
    <div class="sum-cell">
      <div class="sum-label">Collected</div>
      <div class="sum-val green">${fmt(collected)}</div>
    </div>
    <div class="sum-cell">
      <div class="sum-label">Outstanding</div>
      <div class="sum-val amber">${fmt(outstanding)}</div>
    </div>
    <div class="sum-cell">
      <div class="sum-label">Expenses</div>
      <div class="sum-val red">${fmt(expenseTotal)}</div>
    </div>
    <div class="sum-cell">
      <div class="sum-label">Net</div>
      <div class="sum-val ${net >= 0 ? "green" : "red"}">${fmt(net)}</div>
    </div>
  </div>

  <!-- Turf Bookings -->
  <div class="section">
    <div class="sec-title">⚽ Turf Bookings (${(records?.turf ?? []).length})</div>
    <table>
      <thead><tr>
        <th>Customer</th><th>Phone</th><th>Slot</th>
        <th class="c">Tier</th><th class="r">Total</th>
        <th class="r">Advance</th><th class="c">Method</th><th class="c">Status</th>
      </tr></thead>
      <tbody>
        ${turfRows}
        <tr class="subtotal">
          <td colspan="4">Turf Total</td>
          <td class="r">${fmt(turfTotal)}</td>
          <td colspan="3"></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Swimming -->
  <div class="section">
    <div class="sec-title">🏊 Swimming Sessions (${(records?.swim ?? []).length})</div>
    <table>
      <thead><tr>
        <th class="c">Token</th><th class="c">People</th><th class="c">Hours</th>
        <th class="r">Rate</th><th class="r">Total</th>
        <th class="c">Entry</th><th class="c">Exit</th>
        <th class="c">Method</th><th class="c">Status</th>
      </tr></thead>
      <tbody>
        ${swimRows}
        <tr class="subtotal">
          <td colspan="4">Swimming Total</td>
          <td class="r">${fmt(swimTotal)}</td>
          <td colspan="4"></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Food Sales -->
  <div class="section">
    <div class="sec-title">🍽 Food Sales (${(records?.food ?? []).length})</div>
    <table>
      <thead><tr>
        <th class="c">Token</th><th>Items</th><th class="r">Subtotal</th>
        <th class="r">Discount</th><th class="r">Total</th>
        <th class="c">Method</th><th class="c">Status</th>
      </tr></thead>
      <tbody>
        ${foodRows}
        <tr class="subtotal">
          <td colspan="4">Food Total</td>
          <td class="r">${fmt(foodTotal)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Other Items -->
  <div class="section">
    <div class="sec-title">📦 Other Items (${(records?.other ?? []).length})</div>
    <table>
      <thead><tr>
        <th class="c">Token</th><th>Items</th><th class="r">Subtotal</th>
        <th class="r">Discount</th><th class="r">Total</th>
        <th class="c">Method</th><th class="c">Status</th>
      </tr></thead>
      <tbody>
        ${otherRows}
        <tr class="subtotal">
          <td colspan="4">Other Items Total</td>
          <td class="r">${fmt(otherTotal)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Expenses -->
  <div class="section">
    <div class="sec-title">💸 Expenses (${expenses.length})</div>
    <table>
      <thead><tr><th>Description</th><th class="r">Amount</th></tr></thead>
      <tbody>
        ${expenseRows}
        <tr class="subtotal">
          <td>Total Expenses</td>
          <td class="r" style="color:#dc2626;">${fmt(expenseTotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Net result -->
  <div class="net-box">
    <div class="net-cell">
      <div class="net-label">Total Revenue</div>
      <div class="net-val blue">${fmt(revenue)}</div>
    </div>
    <div class="net-cell">
      <div class="net-label">Total Expenses</div>
      <div class="net-val red">− ${fmt(expenseTotal)}</div>
    </div>
    <div class="net-cell">
      <div class="net-label">Net Profit / Loss</div>
      <div class="net-val ${net >= 0 ? "green" : "red"}">${fmt(net)}</div>
    </div>
  </div>

  <div class="footer">
    Rangpur Sports Arena &nbsp;·&nbsp; ${dateLabel} &nbsp;·&nbsp; Generated by ${generatedBy}
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { alert("Popups are blocked. Allow popups and try again."); return; }
  win.document.write(html);
  win.document.close();
}
