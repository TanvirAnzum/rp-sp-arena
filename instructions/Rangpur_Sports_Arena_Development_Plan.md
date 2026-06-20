# Rangpur Sports Arena — Management System
### Development Plan

**Prepared for:** Rangpur Sports Arena
**Platform:** Web application (Firebase)
**Purpose:** Internal management system for turf booking, swimming tokens, food sales, and other item sales — with daily/monthly billing reports.

---

## 1. What Will Be Built

A single web app (login-protected, for staff/owner use only) with four core modules. Below is how each module will actually behave day-to-day, including what's editable/customizable by the owner versus fixed by the system.

### Module 1: Turf Booking

**Slot setup (owner-configurable, not hardcoded):**
- The owner can create, edit, or delete time slots from a settings screen — slots are NOT hardcoded into the app. Example: 7:00–8:25 PM, 8:30–9:55 PM, or any custom timing the owner wants to set, including changing slot length later (e.g., switching from 85-minute slots to 60-minute slots) without needing a developer.
- Each slot has: start time, end time, and a price.
- Slots can be set per capacity tier (14 / 16 / 18 players), and the owner can add new tiers later if the arena changes its setup (e.g., a 20-player tier).
- Slots can be marked active/inactive (e.g., temporarily disable a slot for maintenance) without deleting it.

**Booking flow:**
- Staff picks a date → sees all slots for that day with status: Available / Booked / Held.
- Selecting an available slot opens a quick form: customer name, phone number, advance paid (if any), capacity tier.
- Booking automatically locks that slot for that date — no double booking.
- Bookings can be cancelled or rescheduled, with the reason optionally logged.

**Pricing:**
- Each slot+tier combination has a fixed price, set by the owner in advance.
- Owner can update prices anytime (e.g., raise evening prices, add weekend pricing) — these changes apply to new bookings only, not past ones (past bookings keep their original recorded price for accurate historical billing).

So in short: **the slot times/prices are fully owner-customizable through the app itself — not fixed in the code.** This means no developer involvement is needed for day-to-day schedule or price changes.

### Module 2: Swimming

- No fixed slots — staff just records: number of people, hours, and date/time of entry.
- Price is per-person-per-hour, set by the owner and editable anytime from settings (changes apply going forward only).
- Each entry generates a "token" record (essentially a receipt) that can be marked paid/unpaid.
- Optional: simple token number/ID auto-generated for tracking, in case the arena wants a physical token slip too.

### Module 3 & 4: Food Items and Other Selling Items

These two work the same way — a simple, owner-managed product list with point-of-sale style entry.

**Product management (owner does this, no developer needed):**
- **Add product**: name, price, optional category (e.g., drinks, snacks, equipment).
- **Edit product**: update name or price anytime — future sales use the new price; past sales remain unaffected.
- **Remove product**: products can be deactivated (hidden from the sales list but kept in history for old records) or permanently deleted if it was never sold.
- **Stock/quantity**: at this stage, this is sale-quantity tracking (how many sold), not full inventory/stock-level management (i.e., it won't warn you when stock runs low — that's a more advanced feature, listed under "Not Included" below, that can be added later).

**Selling flow:**
- Staff picks item(s) from the existing product list, enters quantity, system calculates total automatically based on the set price.
- Multiple items can be added to one sale/bill (e.g., 2 waters + 1 snack in a single transaction).
- Each sale is logged with date/time for reporting.

### Dashboard & Billing
- Daily and monthly revenue summary, broken down by category (Turf / Swimming / Food / Other)
- Simple visual charts (revenue trends)
- Printable/shareable daily bill or summary
- A single combined bill can be generated if a customer uses multiple services in one visit (e.g., turf + food)

---

## 2. Technology

- **Firebase** (Google's platform) — Hosting, Authentication, and Database
- Runs entirely on **Firebase's free tier**, which is more than sufficient for current business volume — **no hosting or server cost** for the foreseeable future
- Accessible from any device with a browser (desktop, tablet, phone) — no app installation needed

---

## 3. Development Timeline

| Phase | Work | Duration |
|---|---|---|
| 1 | Firebase setup, login system, project structure | 1–2 days |
| 2 | Turf booking module | 2 days |
| 3 | Swimming token module | 1 day |
| 4 | Food + Other items sales (POS) modules | 2 days |
| 5 | Dashboard, daily/monthly reports, billing | 2–3 days |
| 6 | Testing, fixes, staff walkthrough/training | 1–2 days |

**Total estimated time: 10–14 days**

---

## 4. What's Included

- Fully functional web app per the modules above
- Staff/owner login
- Free hosting setup (no recurring cost at current scale)
- One round of revisions after initial delivery
- Basic walkthrough/training session for staff

## 5. What's Not Included (can be added later if needed)

- Multiple staff accounts with role-based permissions
- SMS/email notifications
- Customer-facing booking (online booking by customers themselves)
- Advanced reporting/export to Excel
- Inventory/stock management for food & other items

These can be scoped and quoted separately once the core system is in use.

---

## 6. Next Steps

Once this plan is approved, work will begin on Phase 1. Progress updates will be shared as each module is completed.
