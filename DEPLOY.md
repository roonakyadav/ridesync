# Deploying RideSync to Vercel

Vite + React + Supabase. No backend server — Supabase hosts auth, DB, and
realtime. Deploys are static asset hosting + SPA routing.

## 0. Push to GitHub

In this chat's input box, use the **"Save to GitHub"** feature to push the
repo. You need the repo on GitHub before Vercel can import it.

## 1. Vercel → Add New… → Project

1. Click **Import Git Repository**, pick your `ridesync` repo.
2. On the *Configure Project* screen:

| Setting              | Value                                 |
| -------------------- | ------------------------------------- |
| **Framework Preset** | **Vite**                              |
| **Root Directory**   | `frontend` *(click Edit → select it)* |
| **Build Command**    | `yarn build` *(leave as detected)*    |
| **Output Directory** | `dist` *(leave as detected)*          |
| **Install Command**  | `yarn install` *(leave as detected)*  |

> Setting the Root Directory to `frontend` is important — the repo also
> contains `/backend` (a placeholder FastAPI that isn't used in
> production). Vercel should only see `frontend/`.

## 2. Environment Variables

Expand **Environment Variables** on the same Configure screen and add:

| Name                    | Value                                       | Environments                  |
| ----------------------- | ------------------------------------------- | ----------------------------- |
| `VITE_SUPABASE_URL`     | `https://fyfyhjqmygssghcxbkdf.supabase.co`  | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY`| *(your anon public key)*                    | Production, Preview, Development |

Click **Deploy**. First deploy takes ~60–90s.

## 3. Copy your production URL

Once it's green Vercel gives you a URL like:

```
https://ridesync-abc123.vercel.app
```

You'll also get a preview URL for every branch push. Keep this tab open —
you'll paste these URLs into Supabase next.

## 4. Supabase Auth → URL Configuration

Go to **Supabase Dashboard → Authentication → URL Configuration**.

### Site URL
```
https://ridesync-abc123.vercel.app
```
(Replace with your actual Vercel production URL. Site URL is where Supabase
sends people if a magic link has no other redirect set — make sure it's the
production one, not a preview.)

### Additional Redirect URLs
Add **each of these on its own line**:

```
https://ridesync-abc123.vercel.app/**
https://ridesync-abc123.vercel.app/feed
http://localhost:3000/**
http://localhost:3000/feed
https://35449a08-cf32-4273-80ad-39c46827f3cc.preview.emergentagent.com/**
https://35449a08-cf32-4273-80ad-39c46827f3cc.preview.emergentagent.com/feed
```

Why the wildcards (`/**`)?
The app calls `signInWithOtp({ emailRedirectTo: window.location.origin + '/feed' })`,
which uses whatever origin the user was on. The wildcards future-proof you
against Vercel preview URLs (every PR gets a unique `-git-branchname.vercel.app`
domain) and against the hash fragments Supabase may append during auth.

If you want preview deployments to also accept magic links, add:
```
https://ridesync-*.vercel.app/**
```
(Supabase supports a single `*` wildcard in the subdomain label.)

Click **Save**.

## 5. Sanity checklist (test in production)

1. Visit the Vercel URL — home page should load.
2. Click **Sign in with magic link**, enter your `@sst.scaler.com` email.
3. Check inbox → click the link → should land on `/feed` authenticated.
4. Navigate to `/post-ride`, post a test ride → should redirect to `/ride/:id`.
5. Refresh on `/ride/:id` → should still load (this validates `vercel.json` rewrites).
6. Open the same ride in a second browser as a different user → request to join.
7. First browser: you should get a toast **and** the red bell badge increment live.
8. Accept the request → second browser should get the "You're confirmed" toast live.

If step 5 fails (404 on refresh), open Vercel project → Settings → General →
check that the `vercel.json` from `frontend/` was picked up. If Vercel reports
"No vercel.json found", verify the **Root Directory** is set to `frontend`.

## 6. Magic-link email deliverability (classroom demo)

Supabase's built-in SMTP is rate-limited to **~4 emails/hour per sender** —
fine for dev, not fine for a live demo with 30+ signups. Before demo day:

1. Sign up for **Resend** (free tier: 3000 emails/month, no CC required)
   or **SendGrid** (free tier: 100/day).
2. Supabase Dashboard → Authentication → **Email → Enable Custom SMTP**.
3. Paste the SMTP host/port/user/password from your provider.
4. Send yourself a test magic link to confirm.

## 7. Custom domain (optional)

Vercel Project → **Settings → Domains** → add your domain (e.g.
`ridesync.sst.scaler.com`). After DNS propagates (2–10 minutes):

1. Update Supabase **Site URL** to the custom domain.
2. Add the custom domain to **Additional Redirect URLs**:
   `https://ridesync.sst.scaler.com/**`
3. Done.

## Troubleshooting

| Symptom                                   | Likely cause                                                 |
| ----------------------------------------- | ------------------------------------------------------------ |
| Magic link goes to `/?error=...`          | Redirect URL not in Supabase allow-list — add it in step 4   |
| 404 on refresh of `/feed`, `/ride/:id`    | `vercel.json` not picked up — confirm Root Directory         |
| Blank white page on production            | Missing `VITE_` env vars on Vercel — re-check step 2         |
| "Loading…" skeleton never resolves        | Realtime publication not enabled — dashboard → Replication   |
| No toast when host accepts                | Realtime not enabled on `ride_passengers`                    |
| Bell badge doesn't update live            | Same — Realtime on `ride_passengers` must be on              |
