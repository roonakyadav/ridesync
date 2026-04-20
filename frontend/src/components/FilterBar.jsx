const TRIP_TYPES = [
  { value: 'all',     label: 'All types' },
  { value: 'exam',    label: 'Exam run' },
  { value: 'trip',    label: 'Trip' },
  { value: 'airport', label: 'Airport' },
  { value: 'other',   label: 'Other' },
]

function inputCls(extra = '') {
  return `w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 outline-none transition ${extra}`
}

export default function FilterBar({ filters, onChange, onReset }) {
  function patch(next) { onChange({ ...filters, ...next }) }

  return (
    <div
      data-testid="filter-bar"
      className="bg-white border border-slate-200 rounded-2xl shadow-card p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Destination
          </label>
          <div className="relative">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={filters.destination}
              onChange={(e) => patch({ destination: e.target.value })}
              placeholder="Search destination…"
              data-testid="filter-destination-input"
              className={inputCls('pl-9')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">From</label>
          <input
            type="date" value={filters.fromDate}
            onChange={(e) => patch({ fromDate: e.target.value })}
            data-testid="filter-from-date"
            className={inputCls()}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">To</label>
          <input
            type="date" value={filters.toDate}
            onChange={(e) => patch({ toDate: e.target.value })}
            data-testid="filter-to-date"
            className={inputCls()}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Trip type</label>
          <select
            value={filters.tripType}
            onChange={(e) => patch({ tripType: e.target.value })}
            data-testid="filter-trip-type"
            className={inputCls()}
          >
            {TRIP_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:gap-4 gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Min seats available:{' '}
            <span className="font-semibold text-indigo-700 tabular-nums">{filters.minSeats}</span>
          </label>
          <input
            type="range" min={0} max={7} step={1}
            value={filters.minSeats}
            onChange={(e) => patch({ minSeats: Number(e.target.value) })}
            data-testid="filter-min-seats"
            className="w-full accent-indigo-600"
          />
        </div>
        <button
          type="button"
          onClick={onReset}
          data-testid="filter-reset-button"
          className="px-4 py-2 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shrink-0"
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}
