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

function nowLocalInputValue() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/* Inline SVG icons (stroke-based, consistent) */
const Icon = {
  pin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  tag: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  clock: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  rupee: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12" /><path d="M6 8h12" /><path d="M6 13l8.5 8" /><path d="M6 13h3a5 5 0 0 0 0-10" />
    </svg>
  ),
  phone: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
}

function FieldLabel({ htmlFor, icon, children }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-1.5">
      <span className="text-indigo-600">{icon}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-500 outline-none disabled:bg-slate-100 transition'

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

  function patch(next) { setForm((p) => ({ ...p, ...next })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!user) return setError('You must be signed in to post a ride.')
    if (!form.destination.trim()) return setError('Destination is required.')
    if (!form.departure_time) return setError('Departure time is required.')
    const depDate = new Date(form.departure_time)
    if (Number.isNaN(depDate.getTime()) || depDate.getTime() <= Date.now())
      return setError('Departure time must be in the future.')
    const seats = Number(form.total_seats)
    if (!Number.isInteger(seats) || seats < 2 || seats > 8)
      return setError('Total seats must be between 2 and 8 (including you).')
    if (form.cost_per_person !== '') {
      const c = Number(form.cost_per_person)
      if (Number.isNaN(c) || c < 0) return setError('Cost must be a non-negative number.')
    }
    const waDigits = form.whatsapp_number.replace(/[\s-]/g, '')
    if (!waDigits) return setError('WhatsApp number is required so passengers can contact you.')
    // Validate: exactly 10 digits, starting with 6/7/8/9 (Indian mobile numbers)
    if (!/^[6-9][0-9]{9}$/.test(waDigits))
      return setError('Enter a valid 10-digit Indian mobile number (starting with 6/7/8/9).')
    // Prepend 91 for international format
    const whatsappWithCountryCode = '91' + waDigits

    const host_name =
      profile?.name || user.user_metadata?.name || user.user_metadata?.full_name ||
      (user.email ? user.email.split('@')[0] : 'Student')

    setSubmitting(true)
    const { data, error: apiErr } = await createRide({
      host_id: user.id, host_name,
      destination: form.destination,
      trip_type: form.trip_type,
      departure_time: depDate.toISOString(),
      total_seats: seats,
      cost_per_person: form.cost_per_person,
      whatsapp_number: whatsappWithCountryCode,
    })
    setSubmitting(false)
    if (apiErr) return setError(apiErr.message || 'Could not create ride.')
    navigate(`/ride/${data.ride_id}`, { replace: true })
  }

  return (
    <div data-testid="post-ride-page" className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Post a ride</h1>
        <p className="text-sm text-slate-600 mt-1">
          Fill in the details. You count as 1 seat (the driver), so pick the total
          seats <em>including</em> yourself.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">
        {/* Section: Where & when */}
        <section className="p-5 sm:p-7">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
            Where & when
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <FieldLabel htmlFor="destination" icon={Icon.pin}>Destination</FieldLabel>
              <input
                id="destination" type="text" value={form.destination}
                onChange={(e) => patch({ destination: e.target.value })}
                placeholder="e.g. Yelahanka Airport, JP Nagar exam centre"
                data-testid="post-ride-destination"
                disabled={submitting} className={inputCls} required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="trip_type" icon={Icon.tag}>Trip type</FieldLabel>
                <select
                  id="trip_type" value={form.trip_type}
                  onChange={(e) => patch({ trip_type: e.target.value })}
                  data-testid="post-ride-trip-type"
                  disabled={submitting} className={inputCls}
                >
                  {TRIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel htmlFor="departure_time" icon={Icon.clock}>Departure time</FieldLabel>
                <input
                  id="departure_time" type="datetime-local"
                  value={form.departure_time} min={nowLocalInputValue()}
                  onChange={(e) => patch({ departure_time: e.target.value })}
                  data-testid="post-ride-departure-time"
                  disabled={submitting} className={inputCls} required
                />
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Section: Seats & cost */}
        <section className="p-5 sm:p-7">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
            Seats & cost
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="total_seats" icon={Icon.users}>Total seats (including you)</FieldLabel>
              <input
                id="total_seats" type="number" min={2} max={8} step={1}
                value={form.total_seats}
                onChange={(e) => patch({ total_seats: e.target.value })}
                data-testid="post-ride-total-seats"
                disabled={submitting} className={inputCls} required
              />
            </div>
            <div>
              <FieldLabel htmlFor="cost_per_person" icon={Icon.rupee}>
                Cost per person <span className="text-slate-400 font-normal">(optional)</span>
              </FieldLabel>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">₹</span>
                <input
                  id="cost_per_person" type="number" min={0} step="0.01"
                  value={form.cost_per_person}
                  onChange={(e) => patch({ cost_per_person: e.target.value })}
                  placeholder="300"
                  data-testid="post-ride-cost"
                  disabled={submitting} className={`${inputCls} pl-7`}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Section: Contact */}
        <section className="p-5 sm:p-7">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Contact</div>
          <div className="mt-4">
            <FieldLabel htmlFor="whatsapp_number" icon={Icon.phone}>Your WhatsApp number</FieldLabel>
            <input
              id="whatsapp_number" type="tel" inputMode="tel"
              value={form.whatsapp_number}
              onChange={(e) => patch({ whatsapp_number: e.target.value })}
              placeholder="Enter 10-digit mobile number"
              data-testid="post-ride-whatsapp"
              disabled={submitting} className={inputCls} required
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Passengers tap a <strong>Contact on WhatsApp</strong> button on your ride page to reach you. Enter your 10-digit number; we'll add +91 automatically for the wa.me link.
            </p>
          </div>
        </section>

        {error && (
          <div className="mx-5 sm:mx-7 mb-4">
            <div
              data-testid="post-ride-error"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            >
              {error}
            </div>
          </div>
        )}

        <div className="px-5 sm:px-7 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button" onClick={() => navigate('/feed')} disabled={submitting}
            data-testid="post-ride-cancel"
            className="px-4 py-2 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-white transition"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={submitting}
            data-testid="post-ride-submit"
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 active:bg-slate-950 transition disabled:bg-slate-400 shadow-sm"
          >
            {submitting ? 'Posting…' : 'Post ride'}
          </button>
        </div>
      </form>
    </div>
  )
}
