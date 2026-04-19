import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import {
  listMyRidesAsHost,
  listMyRidesAsPassenger,
} from '../services/rideService.js'
import Skeleton from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

const TRIP_TYPE_LABELS = {
  exam: 'Exam run',
  trip: 'Trip',
  airport: 'Airport',
  other: 'Other',
}

const STATUS_STYLES = {
  open:       'bg-emerald-100 text-emerald-900 border-emerald-200',
  full:       'bg-amber-100 text-amber-900 border-amber-200',
  cancelled:  'bg-rose-100 text-rose-800 border-rose-200',
  completed:  'bg-slate-100 text-slate-700 border-slate-200',
}

const MY_STATUS_STYLES = {
  pending:   'bg-amber-100 text-amber-900 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  declined:  'bg-slate-100 text-slate-600 border-slate-200',
}

function formatDeparture(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function HostRideRow({ ride }) {
  const pendingCount = (ride.passengers ?? []).filter((p) => p.status === 'pending').length
  const confirmedCount = (ride.passengers ?? []).filter((p) => p.status === 'confirmed').length
  const status = ride.status ?? 'open'

  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`dashboard-hosted-${ride.ride_id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {TRIP_TYPE_LABELS[ride.trip_type] ?? ride.trip_type}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.open}`}
            >
              {status}
            </span>
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 truncate">{ride.destination}</div>
          <div className="text-xs text-slate-600">{formatDeparture(ride.departure_time)}</div>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-600">
          <div className="tabular-nums">
            <span className="text-slate-900 font-semibold">{confirmedCount}</span> confirmed
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-800">
                · <strong>{pendingCount}</strong> pending
              </span>
            )}
          </div>
          <div className="mt-1 tabular-nums">{ride.seats_available} seats left</div>
        </div>
      </div>
    </Link>
  )
}

function JoinedRideRow({ row }) {
  const ride = row.ride
  if (!ride) return null
  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`dashboard-joined-${ride.ride_id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {TRIP_TYPE_LABELS[ride.trip_type] ?? ride.trip_type}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${MY_STATUS_STYLES[row.status] ?? MY_STATUS_STYLES.declined}`}
            >
              {row.status}
            </span>
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 truncate">{ride.destination}</div>
          <div className="text-xs text-slate-600">{formatDeparture(ride.departure_time)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Hosted by {ride.host_name}</div>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-600 tabular-nums">
          {ride.seats_available} seats left
        </div>
      </div>
    </Link>
  )
}

export default function MyDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('hosted') // 'hosted' | 'joined'
  const [hosted, setHosted] = useState([])
  const [joined, setJoined] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: h, error: hErr }, { data: j, error: jErr }] = await Promise.all([
      listMyRidesAsHost(user.id),
      listMyRidesAsPassenger(user.id),
    ])
    if (hErr || jErr) setError(hErr || jErr)
    setHosted(h ?? [])
    setJoined(j ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div data-testid="dashboard-page" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Track the rides you host and the ones you&apos;ve joined.</p>
        </div>
        <Link
          to="/post-ride"
          data-testid="dashboard-post-ride-cta"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800 shrink-0"
        >
          + Post a ride
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-slate-200 flex gap-1">
        <button
          type="button"
          onClick={() => setTab('hosted')}
          data-testid="dashboard-tab-hosted"
          className={
            'px-4 py-2 text-sm -mb-px border-b-2 ' +
            (tab === 'hosted'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-500 hover:text-slate-800')
          }
        >
          Rides I posted{' '}
          <span className="ml-1 text-xs text-slate-500 tabular-nums">({hosted.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('joined')}
          data-testid="dashboard-tab-joined"
          className={
            'px-4 py-2 text-sm -mb-px border-b-2 ' +
            (tab === 'joined'
              ? 'border-slate-900 text-slate-900 font-medium'
              : 'border-transparent text-slate-500 hover:text-slate-800')
          }
        >
          Rides I joined{' '}
          <span className="ml-1 text-xs text-slate-500 tabular-nums">({joined.length})</span>
        </button>
      </div>

      {error && (
        <div data-testid="dashboard-error" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error.message}
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div data-testid="dashboard-loading" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Skeleton.Row />
            <Skeleton.Row />
            <Skeleton.Row />
            <Skeleton.Row />
          </div>
        ) : tab === 'hosted' ? (
          hosted.length === 0 ? (
            <EmptyState
              testId="dashboard-hosted-empty"
              icon="car"
              title="You haven't posted any rides yet"
              body="Heading somewhere your classmates might also be going? Post a ride and split the cost."
              ctaLabel="Post your first ride"
              ctaTo="/post-ride"
            />
          ) : (
            <div data-testid="dashboard-hosted-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hosted.map((r) => (
                <HostRideRow key={r.ride_id} ride={r} />
              ))}
            </div>
          )
        ) : joined.length === 0 ? (
          <EmptyState
            testId="dashboard-joined-empty"
            icon="search"
            title="No rides joined yet"
            body="Browse the feed and request a seat on any ride that fits your plan."
            ctaLabel="Browse the feed"
            ctaTo="/feed"
          />
        ) : (
          <div data-testid="dashboard-joined-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {joined.map((row) => (
              <JoinedRideRow key={row.ride?.ride_id || row.created_at} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
