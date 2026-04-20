import { createContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client.js'
import {
  signInWithMagicLink as svcSignInWithMagicLink,
  signOut as svcSignOut,
} from '../services/authService.js'
import { getMyProfile } from '../services/rideService.js'

export const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signInWithMagicLink: async () => ({ data: null, error: null }),
  signOut: async () => ({ error: null }),
  refreshProfile: async () => {},
})

/**
 * Client-side fallback: ensure a public.users row exists for the signed-in
 * user. If the Supabase `on_auth_user_created` DB trigger is allowed on
 * their plan, this upsert is a no-op (row already exists). If the trigger
 * is blocked, this creates the row so FK constraints on rides.host_id
 * still hold. RLS policy `users_insert_self` allows this because
 * uid = auth.uid().
 */
async function ensureProfileRow(authUser) {
  if (!authUser?.id) return
  const name =
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    (authUser.email ? authUser.email.split('@')[0] : 'Student')
  await supabase
    .from('users')
    .upsert(
      { uid: authUser.id, name, email: authUser.email },
      { onConflict: 'uid', ignoreDuplicates: false }
    )
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null)
      return
    }
    const { data } = await getMyProfile(uid)
    setProfile(data ?? null)
  }, [])

  // Initial session load on mount (fixes hard refresh logout bug).
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        const s = data?.session ?? null
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          await ensureProfileRow(s.user)
          await loadProfile(s.user.id)
        }
      } catch (err) {
        console.error('[AuthContext] Failed to get session:', err)
      } finally {
        // Always set loading = false after getSession resolves
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [loadProfile])

  // Subscribe to auth state changes (for subsequent changes only).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        setSession(nextSession)
        setUser(nextSession?.user ?? null)
        if (nextSession?.user) {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await ensureProfileRow(nextSession.user)
          }
          await loadProfile(nextSession.user.id)
        } else {
          setProfile(null)
        }
      }
    )
    return () => {
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signInWithMagicLink = useCallback(async (email) => {
    return svcSignInWithMagicLink(email)
  }, [])

  const signOut = useCallback(async () => {
    return svcSignOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id)
  }, [user, loadProfile])

  const value = {
    user,
    session,
    profile,
    loading,
    signInWithMagicLink,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
