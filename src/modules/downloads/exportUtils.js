import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import * as XLSX from "xlsx";

/* ── helpers ── */
function tsToDate(val) {
  if (!val) return "";
  if (val instanceof Timestamp) return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

function fmtDate(val) {
  const d = tsToDate(val);
  if (!d || isNaN(d)) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmtSimpleDate(val) {
  const d = tsToDate(val);
  if (!d || isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function saveWorkbook(wb, filename) {
  XLSX.writeFile(wb, filename);
}

function makeSheet(headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const colWidths = headers.map((h, i) => ({
    wch: Math.max(
      h.length + 2,
      ...rows.map((r) => String(r[i] ?? "").length + 1)
    ),
  }));
  ws["!cols"] = colWidths;
  return ws;
}

/* TURF BOOKINGS */
export async function downloadTurfBookings(fromDate = null, toDate = null) {
  const constraints = fromDate && toDate
    ? [where("createdAt", ">=", Timestamp.fromDate(fromDate)), where("createdAt", "<=", Timestamp.fromDate(toDate)), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];
  const snap = await getDocs(query(collection(db, "turfBookings"), ...constraints));
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const headers = [
    "Booking Date", "Customer Name", "Phone", "Slot", "Tier",
    "Price (BDT)", "Advance Paid (BDT)", "Remaining (BDT)",
    "Status", "Payment", "Payment Method", "Booked At",
  ];

  const rows = docs.map((b) => {
    const price     = b.price ?? 0;
    const advance   = b.advancePaid ?? 0;
    const remaining = Math.max(0, price - advance);
    return [
      b.date ?? "",
      b.customerName ?? "",
      b.phone ?? "",
      b.slotLabel ?? "",
      b.tier ? b.tier + " person" : "",
      price,
      advance,
      remaining,
      b.status ?? "",
      b.paid ? "Paid" : "Unpaid",
      ((m) => ({ cash: "Cash", card: "Card", mfs: "MFS", others: "Others" }[m] ?? m ?? ""))(b.paymentMethod ?? ""),
      fmtDate(b.createdAt),
    ];
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(headers, rows), "Turf Bookings");
  saveWorkbook(wb, "turf_bookings.xlsx");
}

/* SWIMMING TOKENS */
export async function downloadSwimmingTokens(fromDate = null, toDate = null) {
  const constraints = fromDate && toDate
    ? [where("createdAt", ">=", Timestamp.fromDate(fromDate)), where("createdAt", "<=", Timestamp.fromDate(toDate)), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];
  const snap = await getDocs(query(collection(db, "swimmingTokens"), ...constraints));
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const headers = [
    "Token #", "Date", "People", "Hours", "Rate (BDT/hr)",
    "Subtotal (BDT)", "Discount (BDT)", "VAT (BDT)", "Total (BDT)",
    "Payment", "Payment Method", "Issued At",
  ];

  const rows = docs.map((t) => [
    t.tokenNumber != null ? "#" + String(t.tokenNumber).padStart(3, "0") : "",
    t.date ?? "",
    t.people ?? "",
    t.hours ?? "",
    t.pricePerPersonPerHour ?? "",
    t.totalPrice ?? "",
    t.discountAmt ?? 0,
    t.taxAmt ?? 0,
    t.finalTotal ?? t.totalPrice ?? "",
    t.paid ? "Paid" : "Unpaid",
    ((m) => ({ cash: "Cash", card: "Card", mfs: "MFS", others: "Others" }[m] ?? m ?? ""))(t.paymentMethod ?? ""),
    fmtDate(t.createdAt),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(headers, rows), "Swimming Tokens");
  saveWorkbook(wb, "swimming_tokens.xlsx");
}

/* FOOD SALES */
export async function downloadFoodSales(fromDate = null, toDate = null) {
  const constraints = fromDate && toDate
    ? [where("createdAt", ">=", Timestamp.fromDate(fromDate)), where("createdAt", "<=", Timestamp.fromDate(toDate)), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];
  const snap = await getDocs(query(collection(db, "foodSales"), ...constraints));
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const headers = [
    "Date & Time", "Items", "Subtotal (BDT)", "Discount (BDT)",
    "VAT (BDT)", "Total (BDT)", "Payment", "Payment Method",
  ];

  const rows = docs.map((s) => {
    const itemSummary = Array.isArray(s.items)
      ? s.items.map((i) => i.name + " x" + i.quantity).join(", ")
      : "";
    return [
      fmtDate(s.createdAt),
      itemSummary,
      s.subtotal ?? "",
      s.discountAmt ?? 0,
      s.taxAmt ?? 0,
      s.total ?? "",
      s.paid ? "Paid" : "Unpaid",
      ((m) => ({ cash: "Cash", card: "Card", mfs: "MFS", others: "Others" }[m] ?? m ?? ""))(s.paymentMethod ?? ""),
    ];
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(headers, rows), "Food Sales");
  saveWorkbook(wb, "food_sales.xlsx");
}

/* OTHER ITEMS SALES */
export async function downloadOtherSales(fromDate = null, toDate = null) {
  const constraints = fromDate && toDate
    ? [where("createdAt", ">=", Timestamp.fromDate(fromDate)), where("createdAt", "<=", Timestamp.fromDate(toDate)), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];
  const snap = await getDocs(query(collection(db, "otherSales"), ...constraints));
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const headers = [
    "Date & Time", "Items", "Subtotal (BDT)", "Discount (BDT)",
    "VAT (BDT)", "Total (BDT)", "Payment", "Payment Method",
  ];

  const rows = docs.map((s) => {
    const itemSummary = Array.isArray(s.items)
      ? s.items.map((i) => i.name + " x" + i.quantity).join(", ")
      : "";
    return [
      fmtDate(s.createdAt),
      itemSummary,
      s.subtotal ?? "",
      s.discountAmt ?? 0,
      s.taxAmt ?? 0,
      s.total ?? "",
      s.paid ? "Paid" : "Unpaid",
      ((m) => ({ cash: "Cash", card: "Card", mfs: "MFS", others: "Others" }[m] ?? m ?? ""))(s.paymentMethod ?? ""),
    ];
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(headers, rows), "Other Items Sales");
  saveWorkbook(wb, "other_items_sales.xlsx");
}

/* STAFF LIST */
export async function downloadStaffList() {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "staff"))
  );
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const headers = ["Name", "Email", "Role", "Registered At"];
  const rows = docs.map((u) => [
    u.displayName ?? "",
    u.email ?? "",
    u.role ?? "staff",
    fmtDate(u.createdAt),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(headers, rows), "Staff");
  saveWorkbook(wb, "staff_list.xlsx");
}

/* DASHBOARD SUMMARY (with date range) */
export async function downloadDashboard(fromDate, toDate) {
  const fromTs = Timestamp.fromDate(fromDate);
  const toTs   = Timestamp.fromDate(toDate);

  async function fetchRange(col) {
    const snap = await getDocs(
      query(
        collection(db, col),
        where("createdAt", ">=", fromTs),
        where("createdAt", "<=", toTs),
        orderBy("createdAt", "asc")
      )
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const [turf, swimming, food, other] = await Promise.all([
    fetchRange("turfBookings"),
    fetchRange("swimmingTokens"),
    fetchRange("foodSales"),
    fetchRange("otherSales"),
  ]);

  const dayMap = {};

  function addToDay(dateStr, field, value) {
    if (!dateStr) return;
    if (!dayMap[dateStr]) {
      dayMap[dateStr] = {
        date: dateStr,
        turf: 0, swimming: 0, food: 0, other: 0,
        turfPaid: 0, swimmingPaid: 0, foodPaid: 0, otherPaid: 0,
      };
    }
    dayMap[dateStr][field] += value;
  }

  turf.forEach((b) => {
    const d   = b.date ?? "";
    const amt = b.price ?? 0;
    addToDay(d, "turf", amt);
    if (b.paid) addToDay(d, "turfPaid", amt);
  });

  swimming.forEach((t) => {
    const d   = t.date ?? "";
    const amt = t.finalTotal ?? t.totalPrice ?? 0;
    addToDay(d, "swimming", amt);
    if (t.paid) addToDay(d, "swimmingPaid", amt);
  });

  food.forEach((s) => {
    const d   = s.date ?? "";
    const amt = s.total ?? 0;
    addToDay(d, "food", amt);
    if (s.paid) addToDay(d, "foodPaid", amt);
  });

  other.forEach((s) => {
    const d   = s.date ?? "";
    const amt = s.total ?? 0;
    addToDay(d, "other", amt);
    if (s.paid) addToDay(d, "otherPaid", amt);
  });

  const sortedDays = Object.values(dayMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const dailyHeaders = [
    "Date",
    "Turf Revenue (BDT)", "Turf Collected (BDT)",
    "Swimming Revenue (BDT)", "Swimming Collected (BDT)",
    "Food Revenue (BDT)", "Food Collected (BDT)",
    "Other Revenue (BDT)", "Other Collected (BDT)",
    "Total Revenue (BDT)", "Total Collected (BDT)",
  ];

  const dailyRows = sortedDays.map((r) => {
    const totalRev  = r.turf + r.swimming + r.food + r.other;
    const totalColl = r.turfPaid + r.swimmingPaid + r.foodPaid + r.otherPaid;
    return [
      r.date,
      r.turf, r.turfPaid,
      r.swimming, r.swimmingPaid,
      r.food, r.foodPaid,
      r.other, r.otherPaid,
      totalRev, totalColl,
    ];
  });

  const grandTurf      = sortedDays.reduce((s, r) => s + r.turf, 0);
  const grandTurfPaid  = sortedDays.reduce((s, r) => s + r.turfPaid, 0);
  const grandSwim      = sortedDays.reduce((s, r) => s + r.swimming, 0);
  const grandSwimPaid  = sortedDays.reduce((s, r) => s + r.swimmingPaid, 0);
  const grandFood      = sortedDays.reduce((s, r) => s + r.food, 0);
  const grandFoodPaid  = sortedDays.reduce((s, r) => s + r.foodPaid, 0);
  const grandOther     = sortedDays.reduce((s, r) => s + r.other, 0);
  const grandOtherPaid = sortedDays.reduce((s, r) => s + r.otherPaid, 0);
  const grandTotal     = grandTurf + grandSwim + grandFood + grandOther;
  const grandCollected = grandTurfPaid + grandSwimPaid + grandFoodPaid + grandOtherPaid;

  dailyRows.push([
    "TOTAL",
    grandTurf, grandTurfPaid,
    grandSwim, grandSwimPaid,
    grandFood, grandFoodPaid,
    grandOther, grandOtherPaid,
    grandTotal, grandCollected,
  ]);

  const summaryHeaders = ["Category", "Revenue (BDT)", "Collected (BDT)", "Due (BDT)"];
  const summaryRows = [
    ["Turf",     grandTurf,  grandTurfPaid,  grandTurf - grandTurfPaid],
    ["Swimming", grandSwim,  grandSwimPaid,  grandSwim - grandSwimPaid],
    ["Food",     grandFood,  grandFoodPaid,  grandFood - grandFoodPaid],
    ["Other",    grandOther, grandOtherPaid, grandOther - grandOtherPaid],
    ["TOTAL",    grandTotal, grandCollected, grandTotal - grandCollected],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(summaryHeaders, summaryRows), "Summary");
  XLSX.utils.book_append_sheet(wb, makeSheet(dailyHeaders, dailyRows), "Daily Breakdown");

  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
  saveWorkbook(wb, "dashboard_" + fmt(fromDate) + "_to_" + fmt(toDate) + ".xlsx");
}
