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

const TRIP_STYLES = {
  exam:    { label: 'Exam run', badge: 'bg-amber-50 text-amber-800 ring-amber-200',  accent: 'bg-amber-500'  },
  trip:    { label: 'Trip',     badge: 'bg-indigo-50 text-indigo-800 ring-indigo-200', accent: 'bg-indigo-500' },
  airport: { label: 'Airport',  badge: 'bg-sky-50 text-sky-800 ring-sky-200',         accent: 'bg-sky-500'    },
  other:   { label: 'Other',    badge: 'bg-slate-100 text-slate-700 ring-slate-200',  accent: 'bg-slate-400'  },
}

const STATUS_STYLES = {
  open:      'bg-emerald-50 text-emerald-800 ring-emerald-200',
  full:      'bg-amber-50 text-amber-800 ring-amber-200',
  cancelled: 'bg-rose-50 text-rose-800 ring-rose-200',
  completed: 'bg-slate-100 text-slate-700 ring-slate-200',
}

function waLinkFor(number) {
  if (!number) return null
  const digits = String(number).replace(/[^\d]/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

function avatarInitials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

export default function RideDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [ride, setRide] = useState(null)
  const [passengers, setPassengers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

  const load = useCallback(async () => {
    const [{ data: r, error: rErr }, { data: ps }] = await Promise.all([
      getRide(id),
      listRidePassengers(id),
    ])
    if (rErr) setError(rErr); else setError(null)
    setRide(r ?? null)
    setPassengers(ps ?? [])
  }, [id])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (!id) return undefined
    const channel = supabase
      .channel(`ride-detail-${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rides', filter: `ride_id=eq.${id}` },
        (p) => setRide((prev) => (prev ? { ...prev, ...p.new } : prev)))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ride_passengers', filter: `ride_id=eq.${id}` },
        () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, load])

  if (loading) {
    return (
      <div data-testid="ride-detail-loading" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Skeleton className="h-4 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
            <Skeleton.Row /><Skeleton.Row />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div data-testid="ride-detail-error" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
        {error.message}
      </div>
    )
  }
  if (!ride) {
    return (
      <div data-testid="ride-detail-not-found" className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-display font-bold text-slate-900">Ride not found</h1>
        <Link to="/feed" className="mt-3 inline-block text-indigo-600 underline">← Back to feed</Link>
      </div>
    )
  }

  const ts = TRIP_STYLES[ride.trip_type] ?? TRIP_STYLES.other
  const isHost = user?.id === ride.host_id
  const myRow = user ? passengers.find((p) => p.user_id === user.id) : null
  const myStatus = myRow?.status ?? null
  const depDate = new Date(ride.departure_time)
  const isOpen = ride.status === 'open'
  const hasSeats = ride.seats_available > 0
  const pendingCount = passengers.filter((p) => p.status === 'pending').length
  const confirmedCount = passengers.filter((p) => p.status === 'confirmed').length
  const waLink = waLinkFor(ride.whatsapp_number)

  // ---- action handlers (unchanged logic) ----
  async function handleRequestToJoin() {
    if (!user) return
    setActionMessage(null); setPendingAction('self')
    const { error: err } = await requestToJoin(ride.ride_id, user.id)
    setPendingAction(null)
    if (err) { setActionMessage({ kind: 'error', text: err.message }); return }
    // Don't show action message - the pending status banner will show instead
    await load()
  }
  async function handleAccept(userId) {
    if (ride.seats_available <= 0) {
      setActionMessage({ kind: 'error', text: 'No seats left — decline or bump total seats first.' }); return
    }
    setPendingAction(userId)
    const { error: err } = await setPassengerStatus(ride.ride_id, userId, 'confirmed')
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage(null); await load()
  }
  async function handleDecline(userId) {
    setPendingAction(userId)
    const { error: err } = await setPassengerStatus(ride.ride_id, userId, 'declined')
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage(null); await load()
  }
  async function handleRemove(userId) {
    setPendingAction(userId)
    const { error: err } = await removePassenger(ride.ride_id, userId)
    setPendingAction(null)
    if (err) return setActionMessage({ kind: 'error', text: err.message })
    setActionMessage(null); await load()
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
    setActionMessage(null); await load()
  }

  return (
    <div data-testid="ride-detail-page" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link to="/feed" data-testid="ride-detail-back"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to feed
      </Link>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="sm:col-span-2 space-y-5">
          {/* Hero card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
            <div className={`h-1.5 ${ts.accent}`} />
            <div className="p-5 sm:p-7">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ring-1 text-[11px] font-semibold uppercase tracking-wide ${ts.badge}`}>
                  {ts.label}
                </span>
                <span
                  data-testid="ride-detail-status"
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full ring-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[ride.status] ?? STATUS_STYLES.open}`}
                >
                  {ride.status}
                </span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight break-words">
                {ride.destination}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-medium">
                  {depDate.toLocaleString(undefined, {
                    weekday: 'long', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Key stats row */}
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Seats left</div>
                  <div data-testid="ride-detail-seats" className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">
                    {ride.seats_available}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Cost</div>
                  <div className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">
                    {ride.cost_per_person != null ? `₹${Number(ride.cost_per_person).toFixed(0)}` : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Total</div>
                  <div className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">{ride.total_seats}</div>
                </div>
              </div>

              {/* Action row - responsive: stack on mobile, row on desktop */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                {!isHost && user && !myStatus && isOpen && hasSeats && (
                  <button
                    type="button" onClick={handleRequestToJoin}
                    disabled={pendingAction === 'self'}
                    data-testid="ride-detail-request-join"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 active:bg-slate-950 transition shadow-sm disabled:bg-slate-400"
                  >
                    {pendingAction === 'self' ? 'Sending…' : 'Book Slot'}
                  </button>
                )}
                {/* WhatsApp button visible on all screen sizes */}
                {!isHost && isOpen && waLink && (
                  <a
                    href={waLink} target="_blank" rel="noopener noreferrer"
                    data-testid="ride-detail-whatsapp"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] text-white text-sm font-medium hover:bg-[#1ebe57] transition shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.12 1.59 5.91L0 24l6.4-1.68a11.82 11.82 0 0 0 5.63 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.36-8.44ZM12.04 21.5h-.01a9.63 9.63 0 0 1-4.91-1.34l-.35-.21-3.8 1 1.02-3.7-.23-.38a9.66 9.66 0 0 1-1.48-5.03c0-5.34 4.35-9.68 9.69-9.68 2.59 0 5.02 1.01 6.85 2.84a9.62 9.62 0 0 1 2.84 6.85c0 5.34-4.35 9.68-9.62 9.68Zm5.56-7.24c-.3-.15-1.79-.88-2.07-.98-.28-.1-.48-.15-.68.15-.2.3-.79.98-.96 1.19-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.43-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.47.13-.62.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.68-1.64-.93-2.25-.25-.59-.5-.51-.68-.52-.18-.01-.38-.01-.58-.01a1.1 1.1 0 0 0-.8.38c-.28.3-1.06 1.04-1.06 2.53 0 1.5 1.08 2.94 1.23 3.14.15.2 2.12 3.25 5.14 4.55.72.31 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.79-.73 2.05-1.44.25-.71.25-1.32.17-1.44-.07-.12-.27-.2-.57-.35Z" />
                    </svg>
                    Contact on WhatsApp
                  </a>
                )}
              </div>

              {/* Help note for non-host users */}
              {!isHost && user && !myStatus && isOpen && hasSeats && waLink && (
                <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  💡 <strong>Tip:</strong> Contact the host on WhatsApp first to confirm pickup location and timing, then click <strong>Book Slot</strong> to send your join request.
                </div>
              )}

              {/* My status banners */}
              {!isHost && myStatus === 'pending' && (
                <div data-testid="ride-detail-my-status-pending" className="mt-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  Your request is <strong>pending</strong>. The host will accept or decline soon.
                </div>
              )}
              {!isHost && myStatus === 'confirmed' && (
                <div data-testid="ride-detail-my-status-confirmed" className="mt-4 text-sm text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  You&apos;re <strong>confirmed</strong> on this ride. 🎉
                </div>
              )}
              {!isHost && myStatus === 'declined' && (
                <div data-testid="ride-detail-my-status-declined" className="mt-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  Your request was declined by the host.
                </div>
              )}
              {!isHost && user && !myStatus && (!isOpen || !hasSeats) && (
                <div className="mt-4 text-sm text-slate-500">
                  This ride is {ride.status === 'full' ? 'full' : ride.status}. No new join requests.
                </div>
              )}

              {/* Host controls */}
              {isHost && (
                <div data-testid="ride-detail-host-controls" className="mt-5 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-700">
                    <strong className="text-slate-900 tabular-nums">{pendingCount}</strong> pending ·{' '}
                    <strong className="text-slate-900 tabular-nums">{confirmedCount}</strong> confirmed
                  </span>
                  <span className="ml-auto flex items-center gap-2 flex-wrap">
                    {ride.status === 'open' && (
                      <button type="button" disabled={pendingAction === 'ride-status'}
                              onClick={() => handleHostStatusChange('full')}
                              data-testid="ride-detail-mark-full"
                              className="px-3 py-1.5 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 transition">
                        Mark full
                      </button>
                    )}
                    {ride.status === 'full' && (
                      <button type="button" disabled={pendingAction === 'ride-status'}
                              onClick={() => handleHostStatusChange('open')}
                              data-testid="ride-detail-reopen"
                              className="px-3 py-1.5 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 transition">
                        Reopen
                      </button>
                    )}
                    {ride.status !== 'cancelled' && ride.status !== 'completed' && (
                      <button type="button" disabled={pendingAction === 'ride-status'}
                              onClick={() => handleHostStatusChange('cancelled')}
                              data-testid="ride-detail-cancel"
                              className="px-3 py-1.5 rounded-full border border-rose-200 text-xs text-rose-700 hover:bg-rose-50 transition">
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
                    'mt-4 rounded-xl px-3 py-2 text-sm border ' +
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

          {/* Passengers */}
          <div>
            <h2 className="text-lg font-display font-semibold text-slate-900 mb-3">
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

        {/* Side column — host card */}
        <aside className="space-y-4 sm:sticky sm:top-24 self-start">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Host</div>
            <div className="mt-3 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-base font-semibold flex items-center justify-center shadow-sm"
              >
                {avatarInitials(ride.host_name)}
              </span>
              <div className="min-w-0">
                <Link
                  to={`/profile/${ride.host_id}`}
                  data-testid="ride-detail-host-link"
                  className="font-semibold text-slate-900 hover:text-indigo-700 transition truncate block"
                >
                  {ride.host_name}
                </Link>
                {isHost && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-white">that&apos;s you</span>
                )}
              </div>
            </div>
            <Link
              to={`/profile/${ride.host_id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition"
            >
              View profile
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Coordinating with the host</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Send a request to join, then tap <strong>Contact on WhatsApp</strong> to confirm pickup,
                  share location, and split costs directly with your driver.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
