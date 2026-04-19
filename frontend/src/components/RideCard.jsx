import { Link } from 'react-router-dom'

const TRIP_TYPE_STYLES = {
  exam:    'bg-amber-100 text-amber-900 border-amber-200',
  trip:    'bg-indigo-100 text-indigo-900 border-indigo-200',
  airport: 'bg-sky-100 text-sky-900 border-sky-200',
  other:   'bg-slate-100 text-slate-900 border-slate-200',
}

const TRIP_TYPE_LABELS = {
  exam: 'Exam run',
  trip: 'Trip',
  airport: 'Airport',
  other: 'Other',
}

function formatDeparture(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function RideCard({ ride }) {
  const badge = TRIP_TYPE_STYLES[ride.trip_type] ?? TRIP_TYPE_STYLES.other
  const label = TRIP_TYPE_LABELS[ride.trip_type] ?? ride.trip_type

  return (
    <Link
      to={`/ride/${ride.ride_id}`}
      data-testid={`ride-card-${ride.ride_id}`}
      className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-400 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${badge}`}
              data-testid={`ride-card-${ride.ride_id}-badge`}
            >
              {label}
            </span>
            <span className="text-xs text-slate-500">
              Posted by {ride.host_name}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 truncate">
            {ride.destination}
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            {formatDeparture(ride.departure_time)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-semibold text-slate-900 tabular-nums">
            {ride.seats_available}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            seats left
          </div>
          {ride.cost_per_person != null && (
            <div className="mt-2 text-sm text-slate-700">
              ₹{Number(ride.cost_per_person).toFixed(0)}/person
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
