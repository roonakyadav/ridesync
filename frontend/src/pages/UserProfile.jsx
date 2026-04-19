import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import {
  getProfileByUid,
  listRidesByHost,
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
  open:      'bg-emerald-100 text-emerald-900 border-emerald-200',
  full:      'bg-amber-100 text-amber-900 border-amber-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
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

function initials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function HostedRideRow({ ride }) {
  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`profile-ride-${ride.ride_id}`}
      className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              {TRIP_TYPE_LABELS[ride.trip_type] ?? ride.trip_type}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[ride.status] ?? STATUS_STYLES.open}`}
            >
              {ride.status}
            </span>
          </div>
          <div className="mt-1 text-base font-semibold text-slate-900 truncate">{ride.destination}</div>
          <div className="text-xs text-slate-600">{formatDeparture(ride.departure_time)}</div>
        </div>
        <div className="text-right shrink-0 text-xs text-slate-600 tabular-nums">
          {ride.seats_available} seats left
        </div>
      </div>
    </Link>
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
    setLoading(true)
    setError(null)
    const [{ data: p, error: pErr }, { data: rs, error: rErr }] = await Promise.all([
      getProfileByUid(uid),
      listRidesByHost(uid),
    ])
    if (pErr || rErr) setError(pErr || rErr)
    setProfile(p ?? null)
    setRides(rs ?? [])
    setLoading(false)
  }, [uid])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div data-testid="profile-loading" className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
        <div className="mt-8 space-y-2">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton.Row />
          <Skeleton.Row />
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div data-testid="profile-error" className="max-w-3xl mx-auto px-6 py-10 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
        {error.message}
      </div>
    )
  }
  if (!profile) {
    return (
      <div data-testid="profile-not-found" className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900">Profile not found</h1>
        <Link to="/feed" className="mt-3 inline-block text-slate-900 underline">Back to feed</Link>
      </div>
    )
  }

  const isMe = user?.id === profile.uid
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: 'long', year: 'numeric',
      })
    : null

  return (
    <div data-testid="profile-page" className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt=""
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div
              aria-hidden="true"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-semibold shrink-0"
            >
              {initials(profile.name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 data-testid="profile-name" className="text-xl sm:text-2xl font-semibold text-slate-900 break-words">
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

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div
            data-testid="profile-rides-posted"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="text-3xl font-semibold text-slate-900 tabular-nums">
              {profile.rides_posted ?? 0}
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">rides posted</div>
          </div>
          <div
            data-testid="profile-rides-joined"
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="text-3xl font-semibold text-slate-900 tabular-nums">
              {profile.rides_joined ?? 0}
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">rides joined</div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Rides hosted by {isMe ? 'you' : profile.name.split(' ')[0]}
        </h2>
        {rides.length === 0 ? (
          <EmptyState
            testId="profile-hosted-empty"
            icon="car"
            title={isMe ? "You haven't hosted a ride yet" : 'No rides hosted yet'}
            body={isMe ? 'When you post a ride, it\u2019ll show up here.' : 'Check back later — they might post one soon.'}
            ctaLabel={isMe ? 'Post a ride' : undefined}
            ctaTo={isMe ? '/post-ride' : undefined}
          />
        ) : (
          <div data-testid="profile-hosted-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rides.map((r) => (
              <HostedRideRow key={r.ride_id} ride={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
