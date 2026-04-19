import { supabase } from '../integrations/supabase/client.js'

export const ALLOWED_EMAIL_DOMAIN = 'sst.scaler.com'

/**
 * Client-side domain guard.
 * Returns { valid, error } — reject before hitting Supabase.
 */
export function validateEmailDomain(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required.' }
  }
  const trimmed = email.trim().toLowerCase()
  if (!trimmed.includes('@')) {
    return { valid: false, error: 'Invalid email format.' }
  }
  if (!trimmed.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    return {
      valid: false,
      error: `Only @${ALLOWED_EMAIL_DOMAIN} emails are allowed.`,
    }
  }
  return { valid: true, error: null }
}

export function isAllowedEmail(email) {
  return validateEmailDomain(email).valid
}

/**
 * Magic-link redirect target — derived at runtime from window.location.origin
 * so it works across dev / preview / prod without hardcoding.
 */
function getEmailRedirectTo() {
  if (typeof window === 'undefined') return undefined
  return `${window.location.origin}/feed`
}

/**
 * Sign in with magic link (OTP via email).
 * Two-layer domain check: client-side here + Postgres trigger as backup.
 */
export async function signInWithMagicLink(email) {
  const validation = validateEmailDomain(email)
  if (!validation.valid) {
    return { data: null, error: new Error(validation.error) }
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: getEmailRedirectTo(),
      shouldCreateUser: true,
    },
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session ?? null, error }
}
