import { Link } from 'react-router-dom'

const TRIP_STYLES = {
  exam: {
    border: 'border-l-amber-500',
    badge:  'bg-amber-50 text-amber-800 ring-amber-200',
    label:  'Exam run',
  },
  trip: {
    border: 'border-l-indigo-500',
    badge:  'bg-indigo-50 text-indigo-800 ring-indigo-200',
    label:  'Trip',
  },
  airport: {
    border: 'border-l-sky-500',
    badge:  'bg-sky-50 text-sky-800 ring-sky-200',
    label:  'Airport',
  },
  other: {
    border: 'border-l-slate-400',
    badge:  'bg-slate-100 text-slate-700 ring-slate-200',
    label:  'Other',
  },
}

function avatarInitials(name) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function formatDeparture(iso) {
  try {
    const d = new Date(iso)
    const date = d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    const time = d.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })
    return { date, time }
  } catch {
    return { date: iso, time: '' }
  }
}

function SeatPill({ seats }) {
  let tone
  if (seats <= 0)      tone = 'bg-rose-50 text-rose-700 ring-rose-200'
  else if (seats === 1) tone = 'bg-amber-50 text-amber-800 ring-amber-200'
  else                  tone = 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ring-1 text-xs font-semibold ${tone}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span className="tabular-nums">{seats}</span>
      <span>left</span>
    </span>
  )
}

export default function RideCard({ ride }) {
  const s = TRIP_STYLES[ride.trip_type] ?? TRIP_STYLES.other
  const { date, time } = formatDeparture(ride.departure_time)

  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`ride-card-${ride.ride_id}`}
      className={`group block bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-slate-200 border-l-4 ${s.border} p-5 transition hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              data-testid={`ride-card-${ride.ride_id}-badge`}
              className={`inline-flex items-center px-2 py-0.5 rounded-full ring-1 text-[11px] font-semibold uppercase tracking-wide ${s.badge}`}
            >
              {s.label}
            </span>
            {ride.status && ride.status !== 'open' && (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
                {ride.status}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 truncate group-hover:text-slate-950">
            {ride.destination}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="font-medium text-slate-800">{date}</span>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums">{time}</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-[11px] font-semibold flex items-center justify-center shadow-sm"
            >
              {avatarInitials(ride.host_name)}
            </span>
            <span className="text-xs text-slate-600 truncate">
              Hosted by <span className="font-medium text-slate-800">{ride.host_name}</span>
            </span>
          </div>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-2">
          <SeatPill seats={ride.seats_available} />
          {ride.cost_per_person != null && (
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900 tabular-nums">
                ₹{Number(ride.cost_per_person).toFixed(0)}
              </span>
              <span className="text-xs text-slate-500">/person</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
