# Test Credentials

## Supabase (Phase 1/2)
- **Project URL:** https://fyfyhjqmygssghcxbkdf.supabase.co
- **Anon public key:** stored in `/app/frontend/.env` (`VITE_SUPABASE_ANON_KEY`)

## Magic-link test account
No static test user — Supabase magic-link creates users on first signup.
To test the full happy path:

1. Use any real `@sst.scaler.com` inbox you control.
2. Enter it on `/login` → click **Send magic link**.
3. Open the email → click the link → you should land on `/feed` authenticated.

Non-`@sst.scaler.com` addresses are rejected on two layers:
- Client-side in `src/services/authService.js` (shown as inline error, no API call made)
- Postgres trigger `enforce_sst_email_domain` on `auth.users` (errcode 22023) — only fires if client-side is bypassed

## Supabase dashboard prerequisites (must be done manually)
- Re-run `/app/SUPABASE_SCHEMA.sql` to create the auth triggers
- Auth → Providers → Email: enable, "Confirm email" **OFF**
- Auth → URL Configuration:
  - Site URL: `https://35449a08-cf32-4273-80ad-39c46827f3cc.preview.emergentagent.com`
  - Additional Redirect URLs include `…/feed` for local + preview domains
