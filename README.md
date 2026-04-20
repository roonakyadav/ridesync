# RideSync — College Carpooling Platform

**A closed-community carpooling platform for SST students to coordinate rides to exams, trips, airports, and anywhere else.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🎯 Problem Statement

**The Problem:** SST students frequently travel to the same destinations — exam centers, airports during breaks, weekend trips — but coordinating rides happens over scattered WhatsApp groups and messages. Students end up paying more for solo rides, wasting seats in cars that could be shared, and coordinating with strangers instead of verified classmates.

**The Solution:** RideSync is a **closed-community carpooling platform** exclusively for SST students (verified via `@sst.scaler.com` email). It lets students:
- **Post rides** they're driving with destination, timing, seats, and cost
- **Browse and filter** available rides in real-time
- **Request to join** rides with host confirmation
- **Coordinate via WhatsApp** once matched
- **Track all their rides** in a personal dashboard

**Why It Matters:** Students save money on transportation, reduce their carbon footprint by sharing rides, and only travel with verified classmates from their own college community.

---

## ✨ Features

### Core Features
- 🔐 **Domain-Locked Authentication** — Only `@sst.scaler.com` emails can sign up (magic-link/OTP-based, no passwords)
- 🚗 **Post Rides** — Create rides with destination, trip type, departure time, seats, cost, and WhatsApp contact
- 🔍 **Live Ride Feed** — Browse open rides with real-time filtering (destination, date range, trip type, minimum seats)
- 📊 **Real-Time Seat Counter** — Seats update live via Supabase Realtime when passengers join/leave
- ✅ **Request-to-Join Flow** — Passengers request, hosts accept/decline with instant notifications
- 📱 **Dashboard** — Track rides you've posted (with pending request counts) and rides you've joined
- 👤 **User Profiles** — View any user's ride history and statistics
- 🔔 **Toast Notifications** — Real-time alerts for join requests, acceptances, and declines
- 💬 **WhatsApp Integration** — One-tap contact with hosts for coordination

### UX Polish
- ⚡ **Loading States** — Skeleton screens on all data-fetching pages
- 🎨 **Empty States** — Contextual messaging with CTAs when no data exists
- 🛡️ **Error Boundary** — Graceful error handling with recovery options
- 📱 **Fully Responsive** — Optimized for mobile, tablet, and desktop
- 🎭 **Animations** — Smooth transitions and fade-in effects
- ♿ **Accessibility** — ARIA labels, semantic HTML, keyboard navigation support

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Functional components with hooks
- **Vite 5** — Fast build tool and dev server
- **React Router v6** — Client-side routing with protected routes
- **Tailwind CSS 3** — Utility-first styling with custom design system
- **Plus Jakarta Sans** — Modern, readable typography

### Backend & Infrastructure
- **Supabase** — Backend-as-a-Service
  - **PostgreSQL** — Relational database with Row-Level Security (RLS)
  - **Auth** — Magic-link authentication with email domain restriction
  - **Realtime** — WebSocket-based live updates via Postgres change listeners
  - **Database Triggers** — Auto-maintained seat counts and user statistics

### Architecture Patterns
- **Context API** — Global state management (Auth, Toasts, Notifications)
- **Custom Hooks** — Reusable logic (`useAuth`, `useRides`)
- **Service Layer** — Separated API/DB logic from UI components
- **Component Composition** — Reusable primitives (Skeleton, EmptyState, RideCard)
- **Protected Routes** — Route guards for authenticated-only pages

---

## 📁 Project Structure

```
ridesync/
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ChatThread.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── PassengerList.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RealtimeNotifier.jsx
│   │   │   ├── RideCard.jsx
│   │   │   └── Skeleton.jsx
│   │   ├── context/           # Global state providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useMessages.js
│   │   │   └── useRides.js
│   │   ├── integrations/
│   │   │   └── supabase/
│   │   │       └── client.js  # Supabase client initialization
│   │   ├── pages/             # Route-level page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── MyDashboard.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── PostRide.jsx
│   │   │   ├── RideDetail.jsx
│   │   │   ├── RideFeed.jsx
│   │   │   └── UserProfile.jsx
│   │   ├── services/          # API/database service layer
│   │   │   ├── authService.js
│   │   │   ├── rideService.js
│   │   │   └── supabase.js
│   │   ├── App.jsx            # Root component with routing
│   │   ├── index.css          # Global styles + Tailwind
│   │   └── main.jsx           # App entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json            # Deployment config for Vercel
│   └── index.html
├── backend/                   # Placeholder (not used — Supabase is the backend)
├── SUPABASE_SCHEMA.sql        # Full database schema + RLS policies + triggers
├── DEPLOY.md                  # Detailed deployment guide
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **yarn** (or npm)
- **Supabase account** (free tier works)
- An `@sst.scaler.com` email address (for authentication)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ridesync.git
cd ridesync/frontend
```

### 2. Install Dependencies

```bash
yarn install
# or
npm install
```

### 3. Set Up Supabase

1. **Create a Supabase project** at [https://supabase.com](https://supabase.com)
2. **Copy your credentials** from Project Settings → API:
   - Project URL
   - anon public key

3. **Create `.env` file** in `frontend/`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run the database schema:**
   - Go to Supabase Dashboard → SQL Editor
   - Paste the entire contents of `SUPABASE_SCHEMA.sql` (in repo root)
   - Click **Run**

5. **Enable Realtime** (for live seat updates and notifications):
   - Dashboard → Database → Replication
   - Enable `supabase_realtime` for these tables:
     - `public.rides`
     - `public.ride_passengers`

6. **Configure Auth:**
   - Dashboard → Authentication → Providers → Email
   - Enable: **Email provider**, **Magic Link**
   - Disable: **Confirm email** (optional, for faster testing)
   - Add redirect URLs:
     - `http://localhost:3000/**`
     - `http://localhost:3000/feed`

### 4. Run the Development Server

```bash
yarn dev
# or
npm run dev
```

The app will be available at **http://localhost:3000**

---

## 🧪 Testing the App

1. **Sign up:** Enter your `@sst.scaler.com` email → check inbox for magic link
2. **Post a ride:** Navigate to "Post Ride" → fill in destination, time, seats, WhatsApp number
3. **Browse feed:** View all open rides, use filters to narrow results
4. **Join a ride:** Click on a ride → "Book Slot" → wait for host approval
5. **Host dashboard:** As a ride host, accept/decline join requests from your Dashboard
6. **Real-time test:** Open the app in two browsers — watch seat counts and notifications update live

---

## 🗄️ Database Schema

### Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `users` | Public user profiles (mirrored from `auth.users`) | `uid`, `name`, `email`, `rides_posted`, `rides_joined` |
| `rides` | Ride listings posted by users | `ride_id`, `host_id`, `destination`, `trip_type`, `departure_time`, `total_seats`, `seats_available`, `status`, `whatsapp_number` |
| `ride_passengers` | Join requests and confirmations | `ride_id`, `user_id`, `status` (pending/confirmed/declined) |
| `messages` | In-app chat (reserved for future) | `message_id`, `ride_id`, `sender_id`, `text` |

### Key Triggers

- **`enforce_sst_email_domain`** — Rejects signups from non-`@sst.scaler.com` emails
- **`handle_new_auth_user`** — Auto-creates `public.users` row on signup
- **`rides_set_initial_seats`** — Sets `seats_available = total_seats - 1` (host takes 1 seat)
- **`ride_passengers_refresh_seats`** — Recalculates `seats_available` on passenger changes
- **User counter triggers** — Auto-maintain `rides_posted` and `rides_joined` stats

### Row-Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only see their own passenger requests
- Hosts can see all passengers for their rides
- Only authenticated users can access data
- Hosts can only manage their own rides

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit: RideSync v1.0"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com) → New Project
   - Import your GitHub repo
   - **Root Directory:** `frontend` (important!)
   - **Framework Preset:** Vite
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Update Supabase Auth URLs:**
   - Add your Vercel production URL to Supabase → Authentication → URL Configuration
   - See `DEPLOY.md` for detailed steps

Full deployment guide: [DEPLOY.md](./DEPLOY.md)

---

## 📸 Screenshots

*(Add screenshots here after deployment)*

- **Home Page:** Landing page with feature tiles
- **Ride Feed:** Filterable list of available rides
- **Ride Detail:** Full ride info with join flow
- **Dashboard:** Host and passenger ride tracking
- **User Profile:** Public profile with stats

---

## 🎓 Learning Outcomes

This project demonstrates:

- ✅ **React Fundamentals:** Components, props, state, effects, conditional rendering
- ✅ **Advanced React:** Custom hooks, Context API, `useMemo`, `useCallback`, `useRef`
- ✅ **Backend Integration:** Supabase Auth, Postgres, Realtime, RLS policies
- ✅ **Architecture:** Service layer, hooks abstraction, component composition
- ✅ **UX Best Practices:** Loading states, error handling, empty states, responsive design
- ✅ **Database Design:** Relational schema, triggers, embedded queries, security policies

---

## 🚧 Future Enhancements

- [ ] In-app messaging (replace WhatsApp dependency)
- [ ] Route optimization for multiple pickups
- [ ] Ride rating and review system
- [ ] Recurring rides (e.g., daily commute)
- [ ] Admin dashboard for community moderation
- [ ] Push notifications for mobile
- [ ] Dark mode support
- [ ] i18n for multiple languages

---

## 👨‍💻 Author

**Built as an end-term project for "Building Web Applications with React" course**

- **Student:** [Your Name]
- **Batch:** 2029
- **Institution:** Scaler School of Technology (SST)

---

## 📄 License

This project is for educational purposes. Feel free to fork and learn from it!

---

> 💡 **Note:** This is not just an assignment — it's a portfolio piece built to solve a real problem for the SST community.
