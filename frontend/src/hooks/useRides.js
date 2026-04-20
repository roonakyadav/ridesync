import { useCallback, useEffect, useState } from 'react'
import { listRides } from '../services/rideService.js'
import { supabase } from '../integrations/supabase/client.js'

/**
 * Hook that fetches rides with the given filter object and keeps the
 * list live via a Supabase Realtime subscription on the `rides` table.
 * Filters should be memo-stable (pass a useMemo'd object).
 */
export default function useRides(filters) {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filtersKey = JSON.stringify(filters ?? {})

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const parsed = JSON.parse(filtersKey)
      const { data, error: err } = await listRides(parsed)
      if (err) {
        console.error('[useRides] Failed to fetch rides:', err)
        setError(err)
      }
      setRides(data ?? [])
    } catch (err) {
      console.error('[useRides] Unexpected error fetching rides:', err)
      setError(err)
      setRides([])
    } finally {
      setLoading(false)
    }
  }, [filtersKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Live updates: any change to the `rides` table triggers a refetch.
  // This keeps the feed seat-counters live and also surfaces new/closed
  // rides without requiring a refresh.
  useEffect(() => {
    const channel = supabase
      .channel('rides-feed-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        () => { refresh() }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { rides, loading, error, refresh }
}
