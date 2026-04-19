const TRIP_TYPES = [
  { value: 'all',     label: 'All types' },
  { value: 'exam',    label: 'Exam run' },
  { value: 'trip',    label: 'Trip' },
  { value: 'airport', label: 'Airport' },
  { value: 'other',   label: 'Other' },
]

export default function FilterBar({ filters, onChange, onReset }) {
  function patch(next) {
    onChange({ ...filters, ...next })
  }

  return (
    <div
      data-testid="filter-bar"
      className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3"
    >
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
        <input
          type="text"
          value={filters.destination}
          onChange={(e) => patch({ destination: e.target.value })}
          placeholder="Search destination…"
          data-testid="filter-destination-input"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
        <input
          type="date"
          value={filters.fromDate}
          onChange={(e) => patch({ fromDate: e.target.value })}
          data-testid="filter-from-date"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
        <input
          type="date"
          value={filters.toDate}
          onChange={(e) => patch({ toDate: e.target.value })}
          data-testid="filter-to-date"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Trip type</label>
        <select
          value={filters.tripType}
          onChange={(e) => patch({ tripType: e.target.value })}
          data-testid="filter-trip-type"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
        >
          {TRIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-4">
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Min seats available: <span className="font-semibold text-slate-900">{filters.minSeats}</span>
        </label>
        <input
          type="range"
          min={0}
          max={7}
          step={1}
          value={filters.minSeats}
          onChange={(e) => patch({ minSeats: Number(e.target.value) })}
          data-testid="filter-min-seats"
          className="w-full accent-slate-900"
        />
      </div>

      <div className="md:col-span-1 flex items-end">
        <button
          type="button"
          onClick={onReset}
          data-testid="filter-reset-button"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
