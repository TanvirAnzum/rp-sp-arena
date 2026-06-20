# Project Instructions

First get the project information from these files before starting any work.

1. First read → `Rangpur_Sports_Arena_Development_Plan.md` & `Rangpur_Sports_Arena_Flowchart.mermaid`
2. Second read → `Rangpur_Owner_vs_Staff_Access.md`
3. Firebase SDK info → `firebase_sdk_info.txt`
4. GitHub repo info → `git_info.txt`

---

## Tech Stack

- **Frontend:** JavaScript + React (no TypeScript — I'm more familiar with JS)
- **Backend/Infra:** Firebase — Auth, Firestore, Hosting
- **IMPORTANT:** Stay strictly within the Firebase **Spark (free) plan**. Do not use Cloud Functions, paid APIs, or any feature that requires the Blaze plan or billing to be enabled. If a feature seems to need it, flag it to me instead of implementing it.

## Folder Structure

Keep things modular by feature, not by file type. Rough structure to follow (adjust as needed, but keep modules separated):

```
/src
  /components       → shared/reusable UI components (buttons, modals, etc.)
  /modules
    /turf            → turf booking logic + UI
    /swimming        → swimming token logic + UI
    /food            → food sales (POS) logic + UI
    /otherItems      → other items sales (POS) logic + UI
    /dashboard       → reports, charts, billing summary
  /auth              → login, role handling
  /firebase          → firebase config, Firestore helpers
  /hooks             → shared custom hooks
  /utils             → shared helper functions
/docs                → documentation, decisions, changelog
```

## Roles & Permissions

- Two roles: **Owner** and **Staff**, as defined in `Rangpur_Owner_vs_Staff_Access.md`.
- Enforce permissions at **two levels**:
  1. Firestore **security rules** (the real enforcement — never rely on UI hiding alone)
  2. UI conditionally shows/hides owner-only actions (slot/price/product management, full reports)
- Role should be stored on the user's document (e.g., `users/{uid}.role = "owner" | "staff"`).

## Coding Conventions

1. Strictly follow standard JavaScript/React conventions (consistent naming, functional components, hooks over class components).
2. Use **plain CSS Modules** (one `.module.css` per component) or **tailwind** for styling — keep it simple, no extra UI framework unless we agree on one later.
3. Site should be **performant, simple, and elegant** — clean layouts, minimal unnecessary dependencies, fast load times.
4. **Everything modular** — each module (turf, swimming, food, other items, dashboard) should be self-contained so new features can be added without touching unrelated modules.
5. State management: keep it simple — React Context + hooks for shared state (auth/role, etc.). Don't introduce Redux or other state libraries unless complexity genuinely requires it — check with me first.

## Testing

- Use manual click-through testing for now (no automated test framework yet).
- Before pushing any major update, walk through the affected feature end-to-end (as Staff and as Owner, where relevant) and confirm it works as expected.
- If the project grows complex enough to need automated tests later, propose it — don't add a testing framework unprompted.

## Git Workflow

1. After any major update: test it, then commit and push to GitHub.
2. **Commit messages:** follow Conventional Commits format — `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` etc.
3. **Branching:** work directly on `main` for now (small solo project) — flag it to me if something risky enough warrants a feature branch instead.

## Documentation

- Keep a `/docs/CHANGELOG.md` — log notable changes after each major update (what was added/changed and why).
- If you deviate from this plan or improvise a better approach, document the reasoning in `/docs` so I can review it later.

## General

- You're welcome to improvise or improve on the plan if you have a better idea — just document it clearly (in `/docs` or as code comments) so I understand the reasoning and can explain it if the customer asks.
