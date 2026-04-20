import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import useRides from '../hooks/useRides.js'
import RideCard from '../components/RideCard.jsx'
import FilterBar from '../components/FilterBar.jsx'
import Skeleton from '../components/Skeleton.jsx'
import EmptyState from '../components/EmptyState.jsx'

const DEFAULT_FILTERS = {
  destination: '', fromDate: '', toDate: '', tripType: 'all', minSeats: 0,
}

const toIsoStart = (d) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined)
const toIsoEnd   = (d) => (d ? new Date(`${d}T23:59:59.999`).toISOString() : undefined)

const isDefaultFilters = (f) =>
  !f.destination && !f.fromDate && !f.toDate && f.tripType === 'all' && f.minSeats === 0

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
    <div data-testid="ride-feed-page" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Live feed
          </span>
          <h1 className="mt-1 text-3xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
            Find your ride
          </h1>
          <p className="text-sm text-slate-600 mt-1">Open rides from fellow SST students — updates in real time.</p>
        </div>
        <Link
          to="/post-ride"
          data-testid="ride-feed-post-ride-cta"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 active:bg-slate-950 transition shadow-sm shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Post a ride
        </Link>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <div className="mt-6">
        {loading ? (
          <div data-testid="ride-feed-loading" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton.Card /><Skeleton.Card /><Skeleton.Card /><Skeleton.Card />
          </div>
        ) : error ? (
          <div data-testid="ride-feed-error" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
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
          <div data-testid="ride-feed-list" className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
            {rides.map((ride) => (
              <RideCard key={ride.ride_id} ride={ride} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
