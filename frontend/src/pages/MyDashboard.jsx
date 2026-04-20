import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import {
  listMyRidesAsHost,
  listMyRidesAsPassenger,
} from '../services/rideService.js'
import Skeleton from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

const TRIP_STYLES = {
  exam:    { label: 'Exam run', border: 'border-l-amber-500'  },
  trip:    { label: 'Trip',     border: 'border-l-indigo-500' },
  airport: { label: 'Airport',  border: 'border-l-sky-500'    },
  other:   { label: 'Other',    border: 'border-l-slate-400'  },
}

const STATUS_STYLES = {
  open:      'bg-emerald-50 text-emerald-800 ring-emerald-200',
  full:      'bg-amber-50 text-amber-800 ring-amber-200',
  cancelled: 'bg-rose-50 text-rose-800 ring-rose-200',
  completed: 'bg-slate-100 text-slate-700 ring-slate-200',
}

const MY_STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-800 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  declined:  'bg-rose-50 text-rose-700 ring-rose-200',
}

function formatDeparture(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function HostRideRow({ ride }) {
  const s = TRIP_STYLES[ride.trip_type] ?? TRIP_STYLES.other
  const pending = (ride.passengers ?? []).filter((p) => p.status === 'pending').length
  const confirmed = (ride.passengers ?? []).filter((p) => p.status === 'confirmed').length

  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`dashboard-hosted-${ride.ride_id}`}
      className={`block bg-white border border-slate-200 border-l-4 ${s.border} rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 p-4 transition relative`}
    >
      {pending > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
          {pending}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 font-medium ${STATUS_STYLES[ride.status] ?? STATUS_STYLES.open}`}>
              {ride.status ?? 'open'}
            </span>
          </div>
          <div className="mt-1 font-semibold text-slate-900 truncate">{ride.destination}</div>
          <div className="text-xs text-slate-600">{formatDeparture(ride.departure_time)}</div>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-600">
          <div className="tabular-nums">
            <span className="text-emerald-700 font-semibold">{confirmed}</span> confirmed
          </div>
          {pending > 0 && (
            <div className="mt-0.5 tabular-nums">
              <span className="text-amber-800 font-semibold">{pending}</span> pending
            </div>
          )}
          <div className="mt-1 tabular-nums text-slate-500">{ride.seats_available} seats left</div>
        </div>
      </div>
    </Link>
  )
}

function JoinedRideRow({ row }) {
  const ride = row.ride
  if (!ride) return null
  const s = TRIP_STYLES[ride.trip_type] ?? TRIP_STYLES.other
  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`dashboard-joined-${ride.ride_id}`}
      className={`block bg-white border border-slate-200 border-l-4 ${s.border} rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 p-4 transition`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 font-semibold ${MY_STATUS_STYLES[row.status] ?? MY_STATUS_STYLES.declined}`}>
              {row.status}
            </span>
          </div>
          <div className="mt-1 font-semibold text-slate-900 truncate">{ride.destination}</div>
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

function TabButton({ active, onClick, children, count, testId }) {
  return (
    <button
      type="button" onClick={onClick} data-testid={testId}
      className={
        'px-4 py-2 rounded-full text-sm font-medium transition inline-flex items-center gap-2 ' +
        (active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
      }
    >
      {children}
      <span
        className={
          'tabular-nums text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ' +
          (active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700')
        }
      >
        {count}
      </span>
    </button>
  )
}

export default function MyDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('hosted')
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
    setHosted(h ?? []); setJoined(j ?? []); setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const pendingTotal = hosted.reduce(
    (acc, r) => acc + (r.passengers ?? []).filter((p) => p.status === 'pending').length, 0
  )

  return (
    <div data-testid="dashboard-page" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track the rides you host and the ones you&apos;ve joined.
            {pendingTotal > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-indigo-700 font-medium">
                · {pendingTotal} pending {pendingTotal === 1 ? 'request' : 'requests'} to review
              </span>
            )}
          </p>
        </div>
        <Link
          to="/post-ride"
          data-testid="dashboard-post-ride-cta"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition shadow-sm shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Post a ride
        </Link>
      </div>

      <div className="mt-6 inline-flex items-center gap-1 p-1 bg-slate-100 rounded-full">
        <TabButton active={tab === 'hosted'} onClick={() => setTab('hosted')} count={hosted.length} testId="dashboard-tab-hosted">
          Rides I posted
        </TabButton>
        <TabButton active={tab === 'joined'} onClick={() => setTab('joined')} count={joined.length} testId="dashboard-tab-joined">
          Rides I joined
        </TabButton>
      </div>

      {error && (
        <div data-testid="dashboard-error" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error.message}
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div data-testid="dashboard-loading" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton.Row /><Skeleton.Row /><Skeleton.Row /><Skeleton.Row />
          </div>
        ) : tab === 'hosted' ? (
          hosted.length === 0 ? (
            <EmptyState
              testId="dashboard-hosted-empty"
              icon="car"
              title="You haven't posted any rides yet"
              body="Heading somewhere your classmates might also be going? Post a ride and split the cost."
              ctaLabel="Post your first ride" ctaTo="/post-ride"
            />
          ) : (
            <div data-testid="dashboard-hosted-list" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              {hosted.map((r) => <HostRideRow key={r.ride_id} ride={r} />)}
            </div>
          )
        ) : joined.length === 0 ? (
          <EmptyState
            testId="dashboard-joined-empty"
            icon="search"
            title="No rides joined yet"
            body="Browse the feed and request a seat on any ride that fits your plan."
            ctaLabel="Browse the feed" ctaTo="/feed"
          />
        ) : (
          <div data-testid="dashboard-joined-list" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
            {joined.map((row) => <JoinedRideRow key={row.ride?.ride_id || row.created_at} row={row} />)}
          </div>
        )}
      </div>
    </div>
  )
}
