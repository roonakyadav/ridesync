import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getProfileByUid, listRidesByHost } from '../services/rideService.js'
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

function formatDeparture(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

function HostedRideRow({ ride }) {
  const s = TRIP_STYLES[ride.trip_type] ?? TRIP_STYLES.other
  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`profile-ride-${ride.ride_id}`}
      className={`block bg-white border border-slate-200 border-l-4 ${s.border} rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 p-4 transition`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 font-medium ${STATUS_STYLES[ride.status] ?? STATUS_STYLES.open}`}>
              {ride.status}
            </span>
          </div>
          <div className="mt-1 font-semibold text-slate-900 truncate">{ride.destination}</div>
          <div className="text-xs text-slate-600">{formatDeparture(ride.departure_time)}</div>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-600 tabular-nums">
          {ride.seats_available} seats left
        </div>
      </div>
    </Link>
  )
}

function StatTile({ value, label, icon, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${accent}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</div>
          <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function UserProfile() {
  const { uid } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const [{ data: p, error: pErr }, { data: rs, error: rErr }] = await Promise.all([
      getProfileByUid(uid), listRidesByHost(uid),
    ])
    if (pErr || rErr) setError(pErr || rErr)
    setProfile(p ?? null); setRides(rs ?? []); setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div data-testid="profile-loading" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 animate-pulse">
          <div className="flex items-start gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
        <div className="mt-8 space-y-2">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton.Row /><Skeleton.Row />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div data-testid="profile-error" className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
        {error.message}
      </div>
    )
  }
  if (!profile) {
    return (
      <div data-testid="profile-not-found" className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-display font-bold text-slate-900">Profile not found</h1>
        <Link to="/feed" className="mt-3 inline-block text-indigo-600 underline">← Back to feed</Link>
      </div>
    )
  }

  const isMe = user?.id === profile.uid
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null

  return (
    <div data-testid="profile-page" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600" />
        <div className="px-5 sm:px-7 pb-6 -mt-10">
          <div className="flex items-end gap-4">
            {profile.photo_url ? (
              <img
                src={profile.photo_url} alt=""
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-sm shrink-0"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white text-xl font-bold flex items-center justify-center ring-4 ring-white shadow-sm shrink-0"
              >
                {initials(profile.name)}
              </div>
            )}
            <div className="min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 data-testid="profile-name" className="text-2xl font-display font-bold text-slate-900 break-words">
                  {profile.name}
                </h1>
                {isMe && (
                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    you
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 break-all">{profile.email}</p>
              {memberSince && (
                <p className="text-xs text-slate-500 mt-0.5">Member since {memberSince}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatTile
          value={profile.rides_posted ?? 0}
          label="rides posted"
          accent="bg-indigo-50 text-indigo-700 ring-indigo-200"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
              <circle cx="6.5" cy="16.5" r="2.5" />
              <circle cx="16.5" cy="16.5" r="2.5" />
            </svg>
          }
        />
        <StatTile
          value={profile.rides_joined ?? 0}
          label="rides joined"
          accent="bg-emerald-50 text-emerald-700 ring-emerald-200"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>

      {/* Hosted rides */}
      <div className="mt-8">
        <h2 className="text-lg font-display font-semibold text-slate-900 mb-3">
          Rides hosted by {isMe ? 'you' : profile.name.split(' ')[0]}
        </h2>
        {rides.length === 0 ? (
          <EmptyState
            testId="profile-hosted-empty" icon="car"
            title={isMe ? "You haven't hosted a ride yet" : 'No rides hosted yet'}
            body={isMe ? 'When you post a ride, it\u2019ll show up here.' : 'Check back later — they might post one soon.'}
            ctaLabel={isMe ? 'Post a ride' : undefined}
            ctaTo={isMe ? '/post-ride' : undefined}
          />
        ) : (
          <div data-testid="profile-hosted-list" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rides.map((r) => <HostedRideRow key={r.ride_id} ride={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}
