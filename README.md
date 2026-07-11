# Rangpur Sports Arena — Management System

A web-based management system for a sports facility, covering swimming pool sessions, turf bookings, canteen sales, expenses, and revenue reporting. Built with React and Firebase.

---

## Tech Stack

- **Frontend** — React (Vite), CSS Modules
- **Backend / Database** — Firebase Firestore (NoSQL)
- **Authentication** — Firebase Auth
- **Hosting** — Firebase Hosting

---

## Features

### Authentication & Role-Based Access
- Email/password login via Firebase Auth
- Two roles: **Owner** and **Staff**
- Owner has full access; Staff access is restricted per module
- Protected routes — unauthenticated users are redirected to login

### Home — Today's Overview
- Live count of active swimming sessions with time remaining
- List of today's turf bookings
- Auto-refreshes every minute

### Swimming Pool Management
- Issue tokens for pool sessions (prebooked time-window or open-ended legacy)
- Real-time active session list with countdown timers
- Post-session billing with receipt generation
- Marks sessions overdue if payment not collected after exit time
- Configurable price per person per hour (owner only)

### Turf Booking
- Manage bookable time slots (owner only)
- Book slots for customers with name and phone
- Receipt generation per booking
- Prevents double-booking on the same slot

### Food / Canteen Sales
- Point-of-sale interface for canteen items
- Cart with quantity control and live total
- Sales history with daily filter
- Product management — add, edit, delete items (owner only)

### Other Items Sales
- Same point-of-sale flow as canteen, for miscellaneous items
- Separate product catalogue and sales history

### Expense Tracking
- Log daily expenses with amount, category, and note
- View and delete expense entries for the selected date

### Revenue Dashboard
- **Daily report** — breakdown of swimming, turf, food, other items, and expenses for any selected date
- **Weekly report** — day-by-day revenue chart for the current or any week
- **Monthly report** — month-level summary with total revenue and paid/unpaid split

### Data Exports (Downloads)
- Export any module's data as CSV for a chosen date range (today / this month / this year / last year / custom)
- Available exports: turf bookings, swimming tokens, food sales, other sales, staff list, dashboard summary

### Staff Management (Owner only)
- View all staff accounts
- Create new staff accounts with email and password
- Remove staff access

### Offline Support
- Detects loss of internet connection and shows a banner
- Firestore offline persistence keeps the app functional on brief disconnects

---

## Project Structure

```
src/
├── auth/               # Firebase Auth context, login page, protected route
├── components/         # Shared UI components (Modal, ConfirmDialog, Layout, etc.)
├── firebase/           # Firebase config and Firestore helpers
├── hooks/              # Global hooks (online status, debounced callback)
├── modules/
│   ├── home/           # Today's overview page
│   ├── swimming/       # Pool token management, billing, price settings
│   ├── turf/           # Slot management and bookings
│   ├── food/           # Canteen POS, products, sales history
│   ├── otherItems/     # Misc items POS (shares food module components)
│   ├── expenses/       # Expense logging
│   ├── dashboard/      # Daily / weekly / monthly revenue reports
│   ├── downloads/      # CSV export page
│   └── staff/          # Staff account management
└── utils/              # Phone validation, debounce helper
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/TanvirAnzum/rp-sp-arena.git
cd rp-sp-arena
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Firebase project credentials:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Get these values from **Firebase Console → Project Settings → Your apps → SDK setup and configuration**.

### 4. Run the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

---

## Deployment

The project is configured for **Firebase Hosting**.

```bash
npm run build
firebase deploy
```

---

## Environment Variables

All Firebase config values are read from environment variables prefixed with `VITE_`. Never commit your `.env` file — use `.env.example` as the template.

---

## License

Private project. All rights reserved.
