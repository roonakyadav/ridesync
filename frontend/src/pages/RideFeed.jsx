import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useRides from '../hooks/useRides.js'
import RideCard from '../components/RideCard.jsx'
import FilterBar from '../components/FilterBar.jsx'
import Skeleton from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

const DEFAULT_FILTERS = {
  destination: '',
  fromDate: '',
  toDate: '',
  tripType: 'all',
  minSeats: 0,
}

function toIsoStart(dateStr) {
  if (!dateStr) return undefined
  return new Date(`${dateStr}T00:00:00`).toISOString()
}
function toIsoEnd(dateStr) {
  if (!dateStr) return undefined
  return new Date(`${dateStr}T23:59:59.999`).toISOString()
}

function isDefaultFilters(f) {
  return (
    !f.destination &&
    !f.fromDate &&
    !f.toDate &&
    f.tripType === 'all' &&
    f.minSeats === 0
  )
}

export default function RideFeed() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const queryFilters = useMemo(
    () => ({
      destination: filters.destination || undefined,
      from: toIsoStart(filters.fromDate),
      to: toIsoEnd(filters.toDate),
      trip_type: filters.tripType === 'all' ? undefined : filters.tripType,
      minSeatsAvailable: filters.minSeats > 0 ? filters.minSeats : undefined,
    }),
    [filters]
  )

  const { rides, loading, error } = useRides(queryFilters)

  return (
    <div data-testid="ride-feed-page" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ride Feed</h1>
          <p className="text-sm text-slate-600">Browse open rides from fellow SST students.</p>
        </div>
        <Link
          to="/post-ride"
          data-testid="ride-feed-post-ride-cta"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800 shrink-0"
        >
          + Post a ride
        </Link>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <div className="mt-6">
        {loading ? (
          <div data-testid="ride-feed-loading" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Skeleton.Card />
            <Skeleton.Card />
            <Skeleton.Card />
            <Skeleton.Card />
          </div>
        ) : error ? (
          <div data-testid="ride-feed-error" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-4">
            Couldn&apos;t load rides: {error.message}
          </div>
        ) : rides.length === 0 ? (
          isDefaultFilters(filters) ? (
            <EmptyState
              testId="ride-feed-empty"
              icon="car"
              title="The road's quiet right now"
              body="Nobody has posted an open ride yet. Be the first — your classmates will thank you."
              ctaLabel="Post the first ride"
              ctaTo="/post-ride"
            />
          ) : (
            <EmptyState
              testId="ride-feed-empty-filtered"
              icon="search"
              title="No rides match your filters"
              body="Try loosening a filter — widen the date range, drop the min-seats slider, or clear the destination search."
              ctaLabel="Reset filters"
              onCtaClick={() => setFilters(DEFAULT_FILTERS)}
            />
          )
        ) : (
          <div data-testid="ride-feed-list" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rides.map((ride) => (
              <RideCard key={ride.ride_id} ride={ride} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
