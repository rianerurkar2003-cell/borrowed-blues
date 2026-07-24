# Borrowed Blues — Product Requirements

## Problem Statement
Therapy companion platform combining a public marketing site and authenticated portals. Feels gentle, editorial, human, hopeful, calm, nature-inspired, reflective, minimal — never clinical, corporate, hospital-like, cold, or overly decorative.

## Personas
- **Prospective client** — public site to reduce uncertainty around beginning therapy
- **Active client** — logs in for upcoming session, latest summary, homework, journal, resources
- **Therapist (Anushka Prabhu)** — logs in for today's schedule, requests, reflections, clients, notes, homework, resources

## Final architecture

### Backend (`/app/backend/`)
```
server.py              # lifespan (async ctx mgr) + env-driven CORS + routers + exception handlers
config.py              # fail-fast env vars
db.py                  # Motor client + 11 indexes
security.py            # bcrypt + JWT + cookie helpers
deps.py                # get_current_user + require_role
models.py              # Pydantic input models + clean()
seed.py                # idempotent startup seed
routers/{auth,public,therapist,client}.py
```
Behaviours: httpOnly cookie sessions, JWT access+refresh with silent refresh, bcrypt password hashing, email-scoped 5-attempt lockout, role guards, TTL on password-reset tokens, centralised exception handlers on Starlette/Validation/generic errors.

### Frontend (`/app/frontend/src/`)
```
App.js                          # BrowserRouter + AuthProvider + QueryClient + ErrorBoundary + Suspense + React.lazy
lib/{types,http,errors}.ts      # typed core: domain types, axios+401 refresh interceptor, AppError
services/{auth,client,therapist,public}.service.ts
state/AuthContext.tsx           # canonical auth provider
shared/components/
  PortalShell.jsx               # single shared shell for both portals (theme prop)
  ProtectedRoute.jsx            # role-based guard
  ErrorBoundary.tsx             # brand-styled top-level fallback
components/{PublicLayout, Watercolor, ConsultationDialog}.jsx
features/client/                # nav.js + index.jsx + 6 sub-pages
features/therapist/             # nav.js + index.jsx + 6 sub-pages
pages/{Home, AboutTherapy, MeetTherapist, Resources, Login}.jsx
```
No compat shims. Every file imports from canonical locations.

## Verification history
- **Iteration 1** — MVP: 20/21 backend + 100% frontend
- **Iteration 2** — NavLink active-state fix: 12/12 routes
- **Iteration 3** — Post-TS/feature-folder refactor: sign-out regression flagged
- **Iteration 4** — Sign-out fix + consultation success state: 20/20
- **Iteration 5** — Backend modular restructure: 22/22 backend + 4/4 frontend
- **Iteration 6** — Final cleanup (lifespan + env CORS + shim removal): validated

## Environment variables (`backend/.env`)
`MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_SEED_EMAIL`, `CLIENT_SEED_PASSWORD`, `CORS_ORIGINS`.

**`CORS_ORIGINS`** — `"*"` → open (`allow_origin_regex=".*"`, dev/preview) · comma-separated list → strict allow-list (prod). Example prod value: `"https://borrowedblues.com,https://www.borrowedblues.com"`.

## Deferred / Backlog (all non-blocking, no visual/functional change)
- **P1** — Real Google Calendar integration (currently MOCKED)
- **P1** — Adobe Fonts kit for actual New Spirit rendering (Fraunces is the fallback)
- **P1** — Anushka's real portrait for Meet Your Therapist
- **P2** — Migrate feature pages from `useState + useEffect` → React Query `useQuery`/`useMutation` (provider already mounted)
- **P2** — `ProtectedRoute` sentinel union → discriminated union (`"loading" | "anonymous" | User`)
- **P2** — Client-side reschedule/cancel appointment; bookmark on resources; notification badges
- **P3** — Rich text + attachments for reflections and session notes

## Test credentials
See `/app/memory/test_credentials.md`.
