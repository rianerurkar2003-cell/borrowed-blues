# Borrowed Blues — Product Requirements

## Problem Statement
Build a therapy companion platform combining a public marketing site and authenticated portals for a client and therapist. The experience must feel gentle, editorial, human, hopeful, calm, nature-inspired, reflective, and minimal — never clinical, corporate, hospital-like, cold, or overly decorative. The website reduces uncertainty around beginning therapy; the portal supports the therapeutic relationship between sessions.

## User Personas
- **Prospective client** — arrives via the public site to understand what therapy is and what to expect.
- **Active client** — logs in to see upcoming session, latest summary, homework, journal, and resources.
- **Therapist** — logs in to see today's schedule, upcoming sessions, consultation requests, recent reflections, and manage clients, notes, homework and resources.

## Core Requirements (from spec)
- Public site: Home, About Therapy, Meet Your Therapist, Resources
- Single Login page (email + password + remember + forgot)
- Auto role-based redirect (therapist ⇒ therapist dashboard, client ⇒ client dashboard)
- Client portal: Dashboard, Appointments, Journal, Homework, Resources, Profile
- Therapist portal: Dashboard, Clients, Calendar, Requests, Resources, Profile
- Watercolor illustration language (birds, water/estuary, eucalyptus, saplings); illustrations progressively quieter through experience
- Typography: Fraunces (serif) headings + Manrope body; palette of forest, teal, sage, moss, cream, warm white, dusty blue

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), JWT httpOnly-cookie auth (bcrypt), role guards, seeded therapist + client + resources + example appointments/notes/homework/reflection/consultation requests on startup
- **Frontend**: React 19, react-router 7, Tailwind + shadcn primitives, sonner toasts, custom SVG watercolor placeholders
- **Auth**: `/api/auth/{register,login,logout,me,refresh,forgot-password,reset-password}` — SameSite=None; Secure; HttpOnly cookies; email-normalised brute-force lockout (X-Forwarded-For aware)

## Implemented — 2026-02
- Public site (Home, About Therapy, Meet Your Therapist, Resources) with editorial hero, pillars, therapy journey, FAQ accordion, therapist profile pulled from DB, filterable/searchable resource library
- Single Login page with illustrated left panel, remember me, forgot-password flow (mocked email — link logged server-side)
- Client Portal: dashboard, appointments (view + request), journal (create with drafts + moods + list), homework (writing + checklist with per-item toggle), resources list, profile
- Therapist Portal: dashboard, clients (session notes + homework assignment per client), calendar (schedule + status transitions), consultation requests (accept/decline), resources (create), profile
- Role-based route protection with automatic redirect
- Seeded demo data on startup for both personas

## Verified — 2026-02 (iteration 1)
- Backend: 20/21 pytest cases passing (auth, role guards, all portal endpoints, seeded data, forgot flow)
- Frontend: 100% of tested user flows (Playwright)
- Brute-force lockout key fixed to be resilient behind K8s ingress (uses email + X-Forwarded-For)

## Deferred / Prioritised Backlog
- **P1** — Real Google Calendar integration (currently architected only)
- **P1** — Rich text editor + attachments for reflections and session notes
- **P2** — Editable therapist profile from the therapist portal
- **P2** — Client-side reschedule/cancel appointment
- **P2** — Bookmark button on resources for clients
- **P2** — Notification badges on portal nav (new homework, new summaries, new resources) + email digests
- **P3** — Split `server.py` into `routers/{auth,therapist,client}.py`
- **P3** — Custom shadcn Calendar + Time picker to replace native inputs

## Next Actions
1. Upload the exact watercolor SVG/PNG assets from Figma and swap them into `/app/frontend/src/components/Watercolor.jsx`
2. Provide the real therapist bio/qualifications to replace the seeded placeholder profile
3. Decide whether Google Calendar sync is P0 or can remain deferred
