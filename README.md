# RideSync

A college carpooling platform for SST students.
Frontend: **Vite + React 18 + Tailwind CSS + React Router v6**
Backend: **Supabase** (Postgres + Auth + Realtime)


---

## Phase 1 — What's done

- [x] Vite + React project scaffolded in `frontend/`
- [x] Tailwind CSS configured (`tailwind.config.js`, `postcss.config.js`, `src/index.css`)
- [x] React Router v6 wired up with all MVP routes
- [x] `@supabase/supabase-js` installed
- [x] Supabase client at `frontend/src/integrations/supabase/client.js`
- [x] Folder structure per PRD §8 (`components/`, `pages/`, `hooks/`, `context/`, `services/`)
- [x] SQL schema + RLS policies in `SUPABASE_SCHEMA.sql`

## Supabase setup (do this next)

1. Create a project at https://supabase.com → copy **Project URL** and **anon public** key.
2. Open `frontend/.env` and fill in:
   ```
   VITE_SUPABASE_URL=https://<your-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   ```
3. In the Supabase dashboard → **SQL Editor** → paste the entire contents of
   `SUPABASE_SCHEMA.sql` and click **Run**.
4. (Optional, for Phase 4+) Dashboard → **Database → Replication** → enable
   Realtime on `rides`, `ride_passengers`, `messages`.
5. Restart the frontend so Vite picks up the new env vars:
   ```bash
   sudo supervisorctl restart frontend
   ```

## Routes

| Path            | Page            |
|-----------------|-----------------|
| `/`             | Home (scaffold) |
| `/login`        | LoginPage       |
| `/feed`         | RideFeed        |
| `/post-ride`    | PostRide        |
| `/ride/:id`     | RideDetail      |
| `/dashboard`    | MyDashboard     |
| `/profile/:uid` | UserProfile     |
| `*`             | NotFound (404)  |

## Folder structure (PRD §8)

```
frontend/src/
├── components/   RideCard, FilterBar, PassengerList, ChatThread, Navbar, NotificationBell
├── pages/        LoginPage, RideFeed, PostRide, RideDetail, MyDashboard, UserProfile, NotFound
├── hooks/        useRides, useAuth, useMessages
├── context/      AuthContext, NotificationContext
├── services/     supabase, rideService, authService
├── integrations/supabase/client.js
├── App.jsx
└── main.jsx
```

Phase 2 (Auth) is next — confirm before we proceed.
