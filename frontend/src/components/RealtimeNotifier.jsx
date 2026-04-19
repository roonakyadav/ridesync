import { useEffect, useRef } from 'react'
import { supabase } from '../integrations/supabase/client.js'
import { useAuth } from '../hooks/useAuth.js'
import { useToast } from '../context/ToastContext.jsx'
import { getRide } from '../services/rideService.js'

/**
 * Subscribes to Supabase Realtime on `ride_passengers` and fires toasts
 * for the current user:
 *
 *  Passenger side (rows where user_id = me):
 *    - UPDATE to status=confirmed → success toast
 *    - UPDATE to status=declined  → info toast
 *  Host side (INSERT on a ride I host):
 *    - status=pending → info toast ("New join request on <destination>")
 *
 * Renders nothing.
 */
export default function RealtimeNotifier() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const rideCache = useRef(new Map()) // ride_id -> destination

  const lookupDestination = async (rideId) => {
    if (rideCache.current.has(rideId)) return rideCache.current.get(rideId)
    const { data } = await getRide(rideId)
    const dest = data?.destination ?? 'your ride'
    rideCache.current.set(rideId, dest)
    return dest
  }

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`realtime-notifier-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ride_passengers' },
        async (payload) => {
          const row = payload.new
          if (!row || row.user_id !== user.id) return

          if (row.status === 'confirmed') {
            const destination = await lookupDestination(row.ride_id)
            showToast({
              kind: 'success',
              title: "You're confirmed 🎉",
              body: `The host confirmed your seat on the ride to ${destination}.`,
              linkTo: `/ride/${row.ride_id}`,
            })
          } else if (row.status === 'declined') {
            const destination = await lookupDestination(row.ride_id)
            showToast({
              kind: 'info',
              title: 'Request declined',
              body: `Your request for the ride to ${destination} was declined.`,
              linkTo: `/ride/${row.ride_id}`,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ride_passengers' },
        async (payload) => {
          const row = payload.new
          if (!row || row.status !== 'pending') return
          // Skip requests I made myself on someone else's ride.
          if (row.user_id === user.id) return

          // Only toast if I host this ride.
          const { data: ride } = await getRide(row.ride_id)
          if (!ride || ride.host_id !== user.id) return
          rideCache.current.set(ride.ride_id, ride.destination)

          showToast({
            kind: 'info',
            title: 'New join request',
            body: `Someone requested to join your ride to ${ride.destination}.`,
            linkTo: `/ride/${row.ride_id}`,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, showToast])

  return null
}
