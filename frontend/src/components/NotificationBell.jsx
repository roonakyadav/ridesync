import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client.js'
import { useAuth } from '../hooks/useAuth.js'

/**
 * Navbar bell — shows a numeric badge with the count of pending
 * join-requests on rides the current user hosts.
 * Updates live via Supabase Realtime on the `ride_passengers` table.
 * Clicking it navigates to the dashboard.
 */
export default function NotificationBell() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setCount(0)
      return
    }
    // Filter on an embedded resource: only ride_passengers rows whose
    // parent ride is hosted by me, status = pending.
    const { count: c, error } = await supabase
      .from('ride_passengers')
      .select('ride_id, rides!inner(host_id)', { count: 'exact', head: true })
      .eq('rides.host_id', user.id)
      .eq('status', 'pending')
    if (!error) setCount(c ?? 0)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Realtime: any change on ride_passengers → refetch count.
  useEffect(() => {
    if (!user?.id) return undefined
    const channel = supabase
      .channel('bell-ride-passengers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ride_passengers' },
        () => { refresh() }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, refresh])

  if (!user) return null

  return (
    <Link
      to="/dashboard"
      data-testid="notification-bell"
      aria-label={`${count} pending join ${count === 1 ? 'request' : 'requests'}`}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 && (
        <span
          data-testid="notification-bell-count"
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-semibold flex items-center justify-center tabular-nums"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
