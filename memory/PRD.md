# Borrowed Blues — Product Requirements

## Problem Statement
Therapy companion platform combining a public marketing site and authenticated portals. Must feel gentle, editorial, human, hopeful, calm, nature-inspired, reflective, minimal — never clinical, corporate, hospital-like, cold, or overly decorative.

## Personas
- **Prospective client** — arrives via the public site to understand what therapy is and what to expect
- **Active client** — logs in to see upcoming session, latest summary, homework, journal, resources
- **Therapist (Anushka Prabhu)** — logs in to see today's schedule, requests, reflections, and manage clients, notes, homework, resources

## Architecture (current)

### Backend (`/app/backend/`)
```
server.py              # thin FastAPI factory: middleware + routers + exception handlers + startup
config.py              # env vars, fail-fast on missing
db.py                  # Motor client + create_indexes()
security.py            # bcrypt + JWT helpers, cookie helpers
deps.py                # get_current_user + require_role dependency factory
models.py              # Pydantic input models + clean() helper
seed.py                # startup seed: therapist + client + profile + samples
routers/
  auth.py              # /api/auth/*
  public.py            # /api/, /therapist/profile, /resources/public, /consultation-requests
  therapist.py         # /api/therapist/*
  client.py            # /api/client/*
```
Mongo indexes: `users.email` unique, `users.role`, appointment hot-paths on (therapist_id,date) and (client_id,date) and status, session_notes/homework/reflections on (owner_id, created_at desc), resources on (is_public, category), consultation_requests on (status, created_at desc), TTL on password reset tokens.

### Frontend (`/app/frontend/src/`)
```
App.js                    # BrowserRouter + AuthProvider + QueryClient + ErrorBoundary + Suspense + React.lazy
lib/
  types.ts                # domain types (User, Appointment, Homework, ...)
  http.ts                 # typed axios + 401 auto-refresh + AppError normalisation
  errors.ts               # AppError class + toAppError()
  api.js                  # compat shim → lib/http
services/
  auth.service.ts
  therapist.service.ts
  client.service.ts
  public.service.ts
state/
  AuthContext.tsx         # typed, memoised auth state
context/AuthContext.jsx   # compat shim → state/AuthContext
shared/components/
  PortalShell.jsx         # single shared portal shell (theme prop)
  ErrorBoundary.tsx       # brand-styled top-level fallback
  ProtectedRoute.jsx      # role-based route guard
components/ProtectedRoute.jsx  # compat shim → shared/components/ProtectedRoute
components/               # PublicLayout, Watercolor (assets), ConsultationDialog
features/
  client/
    index.jsx             # router
    nav.js
    ClientDashboard.jsx, Appointments.jsx, Journal.jsx, Homework.jsx,
    ClientResources.jsx, ClientProfile.jsx
  therapist/
    index.jsx             # router
    nav.js
    TherapistDashboard.jsx, Clients.jsx, CalendarView.jsx, Requests.jsx,
    TherapistResources.jsx, TherapistProfile.jsx
pages/                    # Home, AboutTherapy, MeetTherapist, Resources, Login
```

## Verification history
- **Iteration 1**: 20/21 backend pytest + 100% frontend flows on the initial MVP
- **Iteration 2**: NavLink active-state fix verified 12/12 routes
- **Iteration 3**: Post-refactor regression pass (large TS/feature-folder move) — sign-out landing regression flagged
- **Iteration 4**: Sign-out fix + consultation success state verified — 20/20 spec checks
- **Iteration 5** (this): Backend modular restructure — full regression against monolithic behaviour

## Deferred / Backlog
- **P1** — Real Google Calendar integration (architected only, MOCKED)
- **P1** — Adobe Fonts kit for real New Spirit rendering (Fraunces is the fallback)
- **P1** — Anushka's real portrait for Meet Your Therapist (watercolor placeholder in use)
- **P2** — Migrate feature pages from `useState + useEffect` → React Query `useQuery`/`useMutation` (provider already mounted)
- **P2** — Retire three remaining frontend compat shims (`context/AuthContext.jsx`, `lib/api.js`, `components/ProtectedRoute.jsx`) once the 5 pages still using them are updated to canonical imports
- **P2** — Convert `ProtectedRoute` sentinel union → discriminated union (`"loading" | "anonymous" | User`)
- **P2** — Client-side reschedule/cancel appointment; bookmark button on resources; notification badges on portal nav
- **P3** — Rich text editor + attachments for reflections and session notes

## Environment variables (backend/.env)
`MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_SEED_EMAIL`, `CLIENT_SEED_PASSWORD`, `CORS_ORIGINS`. All required (config.py fails fast on missing).

## Test credentials
See `/app/memory/test_credentials.md`.
