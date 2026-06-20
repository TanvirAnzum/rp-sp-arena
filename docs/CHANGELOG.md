# Changelog

## [Phase 1] — 2026-06-20

### Added
- Vite + React project scaffold (JavaScript, no TypeScript)
- Folder structure: `/src/modules/*`, `/src/auth`, `/src/firebase`, `/src/components`, `/src/hooks`, `/src/utils`
- Firebase config wired (`src/firebase/firebaseConfig.js`) — Auth + Firestore initialized
- `AuthContext` — tracks signed-in user, fetches role from Firestore on login
- `LoginPage` — email/password sign-in with clean dark UI
- `ProtectedRoute` — redirects unauthenticated users to `/login`; supports `ownerOnly` flag
- `Layout` — sidebar navigation shell (RSA branding, module links, user info, sign-out)
- React Router setup: all 5 modules + dashboard routed; dashboard is owner-only
- Placeholder pages for all 5 modules (Turf, Swimming, Food, Other Items, Dashboard)
- `firestore.rules` — role-based security rules covering all collections
- `firebase.json` + `.firebaserc` — hosting + Firestore deploy config

### Notes
- Owner role enforced at both Firestore rules level AND `ProtectedRoute` (dashboard).
- Staff can reach Turf, Swimming, Food, Other Items but not the Dashboard or any settings.
- Past prices/amounts are never overwritten on records — only new records use the current price.
