# RideSync — PRD & Build Log

## Original Problem Statement
College carpooling platform for SST students. Closed community (@sst.scaler.com),
lets students post rides (exam runs, trips, airport), browse/filter open rides,
request to join with host confirmation, and chat in-app once confirmed.

## Tech Stack
- Frontend: **Vite + React 18 + Tailwind CSS + React Router v6**
- Backend: **Supabase** (Postgres + Auth + Realtime) — no custom API server
- Auth: Supabase **magic-link (OTP) email**, domain-locked to `@sst.scaler.com`

## Database Schema (Supabase — full SQL in `/app/SUPABASE_SCHEMA.sql`)
- **users** — uid (FK auth.users), name, email (CHECK `@sst.scaler.com`), photo_url, rides_posted, rides_joined, created_at
- **rides** — ride_id, host_id, host_name, destination, trip_type enum, departure_time, total_seats, cost_per_person, status enum, created_at, **seats_available** (auto-maintained)
- **ride_passengers** — (ride_id, user_id) composite PK, status enum, created_at
- **messages** — message_id, ride_id, sender_id, sender_name, text, sent_at

## Triggers
- **enforce_sst_email_domain** — rejects non-`@sst.scaler.com` signups on `auth.users`
- **handle_new_auth_user** — auto-mirrors `auth.users` → `public.users` on signup
- **rides_set_initial_seats** — on new ride, `seats_available = total_seats - 1` (host)
- **rides_recompute_on_total_change** — keeps `seats_available` correct if host edits `total_seats`
- **ride_passengers_refresh_seats** — recalculates `seats_available` whenever a passenger row is inserted/updated/deleted (confirmed count changes). `SECURITY DEFINER` so it can read rows RLS hides from other users.

## Folder Structure
```
/app
├── SUPABASE_SCHEMA.sql
├── README.md
├── backend/                    # placeholder FastAPI for supervisor
└── frontend/src/
    ├── components/   RideCard, FilterBar, ProtectedRoute, (PRD placeholders)
    ├── pages/        LoginPage, RideFeed, PostRide, RideDetail, MyDashboard, UserProfile, NotFound
    ├── hooks/        useAuth, useRides, useMessages (placeholder)
    ├── context/      AuthContext (with profile), NotificationContext (placeholder)
    ├── services/     supabase, authService, rideService
    ├── integrations/supabase/client.js
    ├── App.jsx
    └── main.jsx
```

## What's Implemented

### 2026-01-19 — Phase 1: Scaffold + Supabase schema
Vite + React + Tailwind + React Router v6 + `@supabase/supabase-js`; full SQL schema with RLS.

### 2026-01-19 — Phase 2: Auth (magic-link, domain-locked)
- `authService.js` (`validateEmailDomain`, `signInWithMagicLink`, `signOut`)
- `AuthContext` / `AuthProvider` subscribes to `onAuthStateChange` with cleanup
- `useAuth` hook, `ProtectedRoute` component
- `LoginPage` with magic-link flow
- Two SQL triggers for domain enforcement + auto-user-mirror
- Verified E2E: `@gmail.com` blocked client-side, `/feed` redirects to `/login`

### 2026-01-19 — Phase 3: Post Ride + Ride Feed
- `rideService.js` — `createRide`, `listRides(filters)`, `getRide(id)`, `getMyProfile(uid)`
- `AuthContext` enriched — now also loads `public.users` profile on sign-in (`refreshProfile()` exposed)
- `useRides(filters)` hook with memo-stable key, loading/error states
- `RideCard` — badge-colored trip type, seats-left counter, cost/person, links to `/ride/:id`
- `FilterBar` — destination search, date-range, trip-type select, min-seats range slider, reset button
- `RideFeed` — fetches open rides via `useRides`, loading / empty / error states, "+ Post a ride" CTA
- `PostRide` — full form (destination, trip_type, departure_time future-only, total_seats 2-8, optional cost_per_person), inline validation, `host_id = user.id`, `host_name = profile.name || user metadata || email local-part`, redirects to `/ride/:id` on success
- `RideDetail` — fetches & displays ride, "You" badge for host, status pill, back link
- New SQL: `seats_available` column + 4 triggers keeping it in sync (see Triggers above)

### 2026-01-19 — Phase 4: Request-to-join + My Dashboard
- `rideService.js` extended: `listRidePassengers`, `requestToJoin`, `setPassengerStatus`, `removePassenger`, `listMyRidesAsHost`, `listMyRidesAsPassenger`, `updateRideStatus`
- `PassengerList` component — status-grouped rows, host-only accept/decline/remove, passenger self-withdraw; reuses RLS semantics (host sees all, passenger sees own row)
- `RideDetail` full join flow:
  - "Request to join" CTA → insert pending row (only when `!isHost && !myStatus && status='open' && seats_available > 0`)
  - Passenger sees their pending / confirmed / declined status inline
  - Host controls: pending+confirmed counts, `Mark full` / `Reopen` / `Cancel ride`, accept/decline on each pending passenger, remove on confirmed passengers
  - Every action calls back to `load()` so `seats_available` (auto-maintained by trigger) stays correct in the UI
- `MyDashboard` with two tabs:
  - "Rides I posted" — embeds `ride_passengers(status)` to show confirmed + pending counts per ride
  - "Rides I joined" — shows my ride_passengers rows with embedded ride and my own status badge
  - Empty states link to Post Ride / Feed

### 2026-01-19 — Phase 5: WhatsApp contact flow + Realtime seat counter + Notification bell
- **SQL:** `rides.whatsapp_number text` column added, with `CHECK (null or matches ^\+?[0-9]{10,15}$)`
- `rideService.createRide` now accepts and persists `whatsapp_number`
- `PostRide` form: required WhatsApp input (tel), client-side pattern validation, stripped of spaces/dashes before save, helper copy explains why
- `RideDetail`:
  - "Contact on WhatsApp" button — emerald, inline-SVG WhatsApp glyph, opens `https://wa.me/<digits>` in new tab (`target="_blank" rel="noopener noreferrer"`); rendered only for non-hosts on open rides that have a number
  - Live Supabase Realtime subscription on `rides (UPDATE where ride_id=eq.<id>)` → merges `seats_available` / `status` into local state with zero refetch
  - Companion Realtime subscription on `ride_passengers (*)` for this ride → triggers `load()` so passenger-list changes reflect live
- `useRides` hook now subscribes to `rides (*)` and refetches on any change — feed seat counters stay live
- `NotificationBell` (new) rendered in `TopBar` only when signed in:
  - Counts pending `ride_passengers` rows whose parent ride is hosted by the current user (PostgREST embedded filter `rides!inner(host_id)`)
  - Live-updates via Realtime subscription on `ride_passengers (*)`
  - Clicking the bell routes to `/dashboard`; red badge with `N` / `99+`; accessible aria-label
- **No messages table / ChatThread / useMessages code added** (scope explicitly out)

### Supabase dashboard steps (manual — user)
1. Run the Phase 5 ALTER TABLE SQL to add `whatsapp_number`
2. Database → Replication → enable `supabase_realtime` for `public.rides` and `public.ride_passengers`

### 2026-01-19 — Phase 6: Toast notifications + Public profile
- **SQL:** trigger-maintained counters on `public.users` (`rides_posted`, `rides_joined`) with one-shot backfill — visible to any authenticated user, no RLS exceptions needed for passenger rows
- `ToastContext` / `ToastProvider` / `useToast` — top-right stack, auto-dismiss (5s), manual close, optional `linkTo` makes the toast itself clickable; kind=`success|info|error`
- `RealtimeNotifier` component (renders nothing) — subscribes to `ride_passengers`:
  - Passenger side: `UPDATE` where `user_id = me` → toast on `confirmed` / `declined`
  - Host side: `INSERT status=pending` where my user hosts the ride → toast "new join request" (verifies via `getRide()` so no leaked cross-host data)
  - Uses a small in-memory `ride_id → destination` cache to avoid re-fetching
- `UserProfile` page (`/profile/:uid`):
  - Fetches via `getProfileByUid` + `listRidesByHost` in parallel
  - Avatar (photo_url or initials fallback), name, email, "Member since"
  - Two big counter tiles wired to the maintained `rides_posted` / `rides_joined`
  - Grid of rides hosted by the user (any status)
- Click-throughs added: TopBar "Profile" link, `RideDetail` host-name link, `PassengerList` passenger-name link → all route to `/profile/:uid`
- `App.jsx` now wraps the tree: `AuthProvider` → `ToastProvider` → `RealtimeNotifier` + `Shell`

### 2026-01-19 — Phase 6.5: Final polish (pre-deploy)
- **Skeleton** primitive (`Skeleton`, `Skeleton.Card`, `Skeleton.Row`) with pulse animation
  - RideFeed: grid of `Skeleton.Card` while loading
  - RideDetail: full-page skeleton matching actual card shape
  - MyDashboard: `Skeleton.Row` grid while loading
  - UserProfile: header + stats tiles + rides list all skeleton'd
- **EmptyState** reusable component with 4 inline SVG icons (`search`, `car`, `inbox`, `user`), optional CTA as `Link` or button
  - RideFeed: two variants — "the road's quiet" (default filters) → "Post the first ride"; "no rides match your filters" (filters applied) → "Reset filters"
  - MyDashboard (hosted): "Post your first ride"
  - MyDashboard (joined): "Browse the feed"
  - UserProfile (hosted): different copy for self vs. others
- **ErrorBoundary** class component wrapping the whole app:
  - Friendly fallback with icon, "Something broke" headline, dev-mode error details, `Reload page` / `Go to home` CTAs
  - Console logs the error + component stack
- **Mobile responsiveness audit:**
  - `TopBar` now sticky, shrinks on mobile: Profile text hides `<sm`, email hides `<lg`, proper gap/padding scaling (`px-4 sm:px-6`)
  - Every page container uses `px-4 sm:px-6 py-6 sm:py-8`
  - Page headers: `flex-col sm:flex-row` so CTAs stack cleanly on narrow screens
  - `RideDetail` top card: `flex-col sm:flex-row` with seat/cost/status re-grouping
  - `RideDetail` action row: `flex-wrap` so WhatsApp + Request-to-join buttons stack
  - `PassengerList` rows: `flex-wrap` so accept/decline buttons wrap under the name on narrow screens
  - `UserProfile`: avatar scales `w-14 sm:w-16`, name uses `break-words`, email uses `break-all`

### Verified (browser automation, mobile 375×812 + desktop 1920×800)
- Home, Login, and protected-route gating all render correctly at both viewports
- Lint clean (ESLint, no errors)
- Zero runtime errors after fixing two stale duplicate-tail leftovers in RideDetail.jsx and UserProfile.jsx from earlier partial replaces

## Supabase dashboard prerequisites (manual — user)
1. Re-run `/app/SUPABASE_SCHEMA.sql` to install Phase 3 triggers + `seats_available` column
2. (Done) Auth → Providers → Email: enabled, Magic Link, Confirm email OFF
3. (Done) Auth → URL Configuration includes `/feed` redirect URLs
4. (For 30+ concurrent demo signups) Auth → SMTP: Resend or SendGrid

## Prioritized Backlog

### P0 — Phase 7 (next)
- Deploy to Vercel (update Supabase Auth Site URL + Redirect URLs with prod domain)
- Classroom-demo SMTP hardening: hook up Resend or SendGrid in Supabase for magic-link delivery at concurrency (30+)

### P1 — Nice-to-have
- Toast for "ride cancelled" (I'm a confirmed passenger) and "ride full"
- Host-side dashboard inbox badge (red dot on cards with pending requests)
- Prefilled WhatsApp message: `wa.me/<digits>?text=Hey%20<host_name>%2C...`
- Quick-select popular destinations on the Post Ride form

## Status
**Phase 6 complete.** Awaiting confirmation before **Phase 7 (deploy)**.
