import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import {
  getRide,
  listRidePassengers,
  requestToJoin,
  setPassengerStatus,
  removePassenger,
  updateRideStatus,
} from '../services/rideService.js'
import { supabase } from '../integrations/supabase/client.js'
import PassengerList from '../components/PassengerList.jsx'
import Skeleton from '../components/Skeleton.jsx'

const TRIP_TYPE_LABELS = {
  exam: 'Exam run',
  trip: 'Trip',
  airport: 'Airport',
  other: 'Other',
}

function waLinkFor(number) {
  if (!number) return null
  // wa.me wants digits only, no +, no spaces.
  const digits = String(number).replace(/[^\d]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}`
}

export default function RideDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [ride, setRide] = useState(null)
  const [passengers, setPassengers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // In-flight action state (userId being mutated OR 'self' for top-level join).
  const [pendingAction, setPendingAction] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

  const load = useCallback(async () => {
    const [{ data: r, error: rErr }, { data: ps, error: pErr }] = await Promise.all([
      getRide(id),
      listRidePassengers(id),
    ])
    if (rErr) setError(rErr)
    else setError(null)
    setRide(r ?? null)
    setPassengers(ps ?? [])
    if (pErr) console.warn('[RideDetail] passengers error:', pErr.message)
  }, [id])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  if (loading) {
    return (
      <div data-testid="ride-detail-loading" className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="text-right shrink-0 space-y-2">
              <Skeleton className="h-10 w-14 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 flex gap-2">
            <Skeleton className="h-9 w-36 rounded-full" />
            <Skeleton className="h-9 w-44 rounded-full" />
          </div>
        </div>
        <div className="mt-8 space-y-2">
          <Skeleton className="h-5 w-32 mb-3" />
          <Skeleton.Row />
          <Skeleton.Row />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div data-testid="ride-detail-error" className="max-w-3xl mx-auto px-6 py-10 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
        {error.message}
      </div>
    )
  }
  if (!ride) {
    return (
      <div data-testid="ride-detail-not-found" className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900">Ride not found</h1>
        <Link to="/feed" className="mt-3 inline-block text-slate-900 underline">Back to feed</Link>
      </div>
    )
  }

  const isHost = user?.id === ride.host_id
  const myRow = user ? passengers.find((p) => p.user_id === user.id) : null
  const myStatus = myRow?.status ?? null

  const depDate = new Date(ride.departure_time)
  const isOpen = ride.status === 'open'
  const hasSeats = ride.seats_available > 0

  async function handleRequestToJoin() {
    if (!user) return
    setActionMessage(null)
    setPendingAction('self')
    const { error: err } = await requestToJoin(ride.ride_id, user.id)
    setPendingAction(null)
    if (err) {
      setActionMessage({ kind: 'error', text: err.message })
      return
    }
    setActionMessage({ kind: 'ok', text: 'Request sent. The host will review it.' })
    await load()
  }

  async function handleAccept(userId) {
    if (ride.seats_available <= 0) {
      setActionMessage({ kind: 'error', text: 'No seats left — decline or bump total seats first.' })
      return
    }
    setPendingAction(userId)
    const { error: err } = await setPassengerStatus(ride.ride_id, userId, 'confirmed')
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage(null)
    await load()
  }

  async function handleDecline(userId) {
    setPendingAction(userId)
    const { error: err } = await setPassengerStatus(ride.ride_id, userId, 'declined')
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage(null)
    await load()
  }

  async function handleRemove(userId) {
    setPendingAction(userId)
    const { error: err } = await removePassenger(ride.ride_id, userId)
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage(null)
    await load()
  }

  async function handleWithdraw(userId) {
    setPendingAction(userId)
    const { error: err } = await removePassenger(ride.ride_id, userId)
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage({ kind: 'ok', text: 'You have withdrawn from this ride.' })
    await load()
  }

  async function handleHostStatusChange(status) {
    setPendingAction('ride-status')
    const { error: err } = await updateRideStatus(ride.ride_id, status)
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage(null)
    await load()
  }

  const pendingCount = passengers.filter((p) => p.status === 'pending').length
  const confirmedCount = passengers.filter((p) => p.status === 'confirmed').length

  return (
    <div data-testid="ride-detail-page" className="max-w-3xl mx-auto px-6 py-8">
      <Link to="/feed" className="text-sm text-slate-500 hover:text-slate-900" data-testid="ride-detail-back">
        ← Back to feed
      </Link>

      <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {TRIP_TYPE_LABELS[ride.trip_type] ?? ride.trip_type}
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{ride.destination}</h1>
            <p className="mt-1 text-slate-700">
              {depDate.toLocaleString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Hosted by{' '}
              <Link
                to={`/profile/${ride.host_id}`}
                data-testid="ride-detail-host-link"
                className="text-slate-800 underline underline-offset-2 hover:text-slate-900"
              >
                {ride.host_name}
              </Link>
              {isHost && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-white">you</span>}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-semibold text-slate-900 tabular-nums" data-testid="ride-detail-seats">
              {ride.seats_available}
            </div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500">seats left</div>
            {ride.cost_per_person != null && (
              <div className="mt-2 text-sm text-slate-700">₹{Number(ride.cost_per_person).toFixed(0)}/person</div>
            )}
            <div className="mt-2">
              <span
                data-testid="ride-detail-status"
                className={
                  'text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ' +
                  (ride.status === 'open'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                    : ride.status === 'full'
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200')
                }
              >
                {ride.status}
              </span>
            </div>
          </div>
        </div>

        {/* Join CTA / self-status */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          {!isHost && user && !myStatus && isOpen && hasSeats && (
            <button
              type="button"
              onClick={handleRequestToJoin}
              disabled={pendingAction === 'self'}
              data-testid="ride-detail-request-join"
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:bg-slate-400"
            >
              {pendingAction === 'self' ? 'Sending…' : 'Request to join'}
            </button>
          )}
          {!isHost && isOpen && waLinkFor(ride.whatsapp_number) && (
            <a
              href={waLinkFor(ride.whatsapp_number)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="ride-detail-whatsapp"
              className="ml-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm hover:bg-emerald-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16" height="16" viewBox="0 0 24 24"
                fill="currentColor" aria-hidden="true"
              >
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.12 1.59 5.91L0 24l6.4-1.68a11.82 11.82 0 0 0 5.63 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.36-8.44ZM12.04 21.5h-.01a9.63 9.63 0 0 1-4.91-1.34l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.66 9.66 0 0 1-1.48-5.03c0-5.34 4.35-9.68 9.69-9.68 2.59 0 5.02 1.01 6.85 2.84a9.62 9.62 0 0 1 2.84 6.85c0 5.34-4.35 9.68-9.62 9.68Zm5.56-7.24c-.3-.15-1.79-.88-2.07-.98-.28-.1-.48-.15-.68.15-.2.3-.79.98-.96 1.19-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.43-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.47.13-.62.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.68-1.64-.93-2.25-.25-.59-.5-.51-.68-.52-.18-.01-.38-.01-.58-.01a1.1 1.1 0 0 0-.8.38c-.28.3-1.06 1.04-1.06 2.53 0 1.5 1.08 2.94 1.23 3.14.15.2 2.12 3.25 5.14 4.55.72.31 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.79-.73 2.05-1.44.25-.71.25-1.32.17-1.44-.07-.12-.27-.2-.57-.35Z" />
              </svg>
              Contact on WhatsApp
            </a>
          )}
          {!isHost && user && !myStatus && (!isOpen || !hasSeats) && (
            <div className="text-sm text-slate-500">
              This ride is {ride.status === 'full' ? 'full' : ride.status}. No new join requests.
            </div>
          )}
          {!isHost && myStatus === 'pending' && (
            <div data-testid="ride-detail-my-status-pending" className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Your request is <strong>pending</strong>. The host will accept or decline soon.
            </div>
          )}
          {!isHost && myStatus === 'confirmed' && (
            <div data-testid="ride-detail-my-status-confirmed" className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              You&apos;re <strong>confirmed</strong> on this ride. 🎉
            </div>
          )}
          {!isHost && myStatus === 'declined' && (
            <div data-testid="ride-detail-my-status-declined" className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
              Your request was declined by the host.
            </div>
          )}

          {/* Host controls */}
          {isHost && (
            <div data-testid="ride-detail-host-controls" className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-700 w-full sm:w-auto">
                <strong>{pendingCount}</strong> pending · <strong>{confirmedCount}</strong> confirmed
              </span>
              <span className="sm:ml-auto flex items-center gap-2 flex-wrap">
                {ride.status === 'open' && (
                  <button
                    type="button"
                    disabled={pendingAction === 'ride-status'}
                    onClick={() => handleHostStatusChange('full')}
                    data-testid="ride-detail-mark-full"
                    className="px-3 py-1.5 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Mark full
                  </button>
                )}
                {ride.status === 'full' && (
                  <button
                    type="button"
                    disabled={pendingAction === 'ride-status'}
                    onClick={() => handleHostStatusChange('open')}
                    data-testid="ride-detail-reopen"
                    className="px-3 py-1.5 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Reopen
                  </button>
                )}
                {ride.status !== 'cancelled' && ride.status !== 'completed' && (
                  <button
                    type="button"
                    disabled={pendingAction === 'ride-status'}
                    onClick={() => handleHostStatusChange('cancelled')}
                    data-testid="ride-detail-cancel"
                    className="px-3 py-1.5 rounded-full border border-rose-200 text-xs text-rose-700 hover:bg-rose-50"
                  >
                    Cancel ride
                  </button>
                )}
              </span>
            </div>
          )}

          {actionMessage && (
            <div
              data-testid="ride-detail-action-message"
              className={
                'mt-4 rounded-lg px-3 py-2 text-sm border ' +
                (actionMessage.kind === 'ok'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200')
              }
            >
              {actionMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Passenger list — only useful to the host (sees all) or the user themself (sees their own row). */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          {isHost ? 'Passengers' : 'Your request'}
        </h2>
        <PassengerList
          passengers={passengers}
          isHost={isHost}
          currentUserId={user?.id}
          pendingAction={pendingAction}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onRemove={handleRemove}
          onWithdraw={handleWithdraw}
        />
      </div>
    </div>
  )
}
