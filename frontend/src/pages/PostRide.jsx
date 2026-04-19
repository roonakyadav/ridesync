import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { createRide } from '../services/rideService.js'

const TRIP_TYPES = [
  { value: 'exam',    label: 'Exam run' },
  { value: 'trip',    label: 'Trip' },
  { value: 'airport', label: 'Airport' },
  { value: 'other',   label: 'Other' },
]

// Build a datetime-local minimum that's ~now (user can't pick the past).
function nowLocalInputValue() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function PostRide() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [form, setForm] = useState({
    destination: '',
    trip_type: 'exam',
    departure_time: '',
    total_seats: 4,
    cost_per_person: '',
    whatsapp_number: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function patch(next) {
    setForm((prev) => ({ ...prev, ...next }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('You must be signed in to post a ride.')
      return
    }

    // Validation
    if (!form.destination.trim()) {
      setError('Destination is required.')
      return
    }
    if (!form.departure_time) {
      setError('Departure time is required.')
      return
    }
    const depDate = new Date(form.departure_time)
    if (Number.isNaN(depDate.getTime()) || depDate.getTime() <= Date.now()) {
      setError('Departure time must be in the future.')
      return
    }
    const seats = Number(form.total_seats)
    if (!Number.isInteger(seats) || seats < 2 || seats > 8) {
      setError('Total seats must be between 2 and 8 (including you).')
      return
    }
    if (form.cost_per_person !== '') {
      const c = Number(form.cost_per_person)
      if (Number.isNaN(c) || c < 0) {
        setError('Cost must be a non-negative number.')
        return
      }
    }

    const waDigits = form.whatsapp_number.replace(/[\s-]/g, '')
    if (!waDigits) {
      setError('WhatsApp number is required so passengers can contact you.')
      return
    }
    if (!/^\+?[0-9]{10,15}$/.test(waDigits)) {
      setError('WhatsApp number must be 10–15 digits, with an optional leading +.')
      return
    }

    const host_name =
      profile?.name ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      (user.email ? user.email.split('@')[0] : 'Student')

    setSubmitting(true)
    const { data, error: apiErr } = await createRide({
      host_id: user.id,
      host_name,
      destination: form.destination,
      trip_type: form.trip_type,
      departure_time: depDate.toISOString(),
      total_seats: seats,
      cost_per_person: form.cost_per_person,
      whatsapp_number: waDigits,
    })
    setSubmitting(false)

    if (apiErr) {
      setError(apiErr.message || 'Could not create ride.')
      return
    }
    navigate(`/ride/${data.ride_id}`, { replace: true })
  }

  return (
    <div data-testid="post-ride-page" className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Post a ride</h1>
      <p className="text-sm text-slate-600 mt-1">
        Fill in the details. You count as 1 seat (the driver), so pick the total
        seats <em>including</em> yourself.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 bg-white border border-slate-200 rounded-xl p-6">
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1">
            Destination / Exam centre
          </label>
          <input
            id="destination"
            type="text"
            value={form.destination}
            onChange={(e) => patch({ destination: e.target.value })}
            placeholder="e.g. Yelahanka Airport, JP Nagar exam centre"
            data-testid="post-ride-destination"
            disabled={submitting}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="trip_type" className="block text-sm font-medium text-slate-700 mb-1">
              Trip type
            </label>
            <select
              id="trip_type"
              value={form.trip_type}
              onChange={(e) => patch({ trip_type: e.target.value })}
              data-testid="post-ride-trip-type"
              disabled={submitting}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
            >
              {TRIP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="departure_time" className="block text-sm font-medium text-slate-700 mb-1">
              Departure time
            </label>
            <input
              id="departure_time"
              type="datetime-local"
              value={form.departure_time}
              min={nowLocalInputValue()}
              onChange={(e) => patch({ departure_time: e.target.value })}
              data-testid="post-ride-departure-time"
              disabled={submitting}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="total_seats" className="block text-sm font-medium text-slate-700 mb-1">
              Total seats (including you)
            </label>
            <input
              id="total_seats"
              type="number"
              min={2}
              max={8}
              step={1}
              value={form.total_seats}
              onChange={(e) => patch({ total_seats: e.target.value })}
              data-testid="post-ride-total-seats"
              disabled={submitting}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              required
            />
          </div>
          <div>
            <label htmlFor="cost_per_person" className="block text-sm font-medium text-slate-700 mb-1">
              Cost per person <span className="text-slate-400 font-normal">(optional, ₹)</span>
            </label>
            <input
              id="cost_per_person"
              type="number"
              min={0}
              step="0.01"
              value={form.cost_per_person}
              onChange={(e) => patch({ cost_per_person: e.target.value })}
              placeholder="e.g. 300"
              data-testid="post-ride-cost"
              disabled={submitting}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="whatsapp_number" className="block text-sm font-medium text-slate-700 mb-1">
            Your WhatsApp number
          </label>
          <input
            id="whatsapp_number"
            type="tel"
            inputMode="tel"
            value={form.whatsapp_number}
            onChange={(e) => patch({ whatsapp_number: e.target.value })}
            placeholder="+91 98765 43210"
            data-testid="post-ride-whatsapp"
            disabled={submitting}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Passengers will tap a &ldquo;Contact on WhatsApp&rdquo; button on your ride page to reach you. Include country code.
          </p>
        </div>

        {error && (
          <div
            data-testid="post-ride-error"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          >
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/feed')}
            disabled={submitting}
            data-testid="post-ride-cancel"
            className="px-4 py-2 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            data-testid="post-ride-submit"
            className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:bg-slate-400"
          >
            {submitting ? 'Posting…' : 'Post ride'}
          </button>
        </div>
      </form>
    </div>
  )
}
