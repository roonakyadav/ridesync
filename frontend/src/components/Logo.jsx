import { Link } from 'react-router-dom'

/**
 * RideSync brand lockup — icon + wordmark. Pass `to` for a linked version
 * (e.g. in the TopBar), omit for a static version (e.g. on LoginPage).
 */
export default function Logo({ to, size = 'md', className = '' }) {
  const sizes = {
    sm: { icon: 20, text: 'text-base' },
    md: { icon: 24, text: 'text-lg' },
    lg: { icon: 32, text: 'text-2xl' },
  }
  const s = sizes[size] || sizes.md

  const content = (
    <span className={`inline-flex items-center gap-2 font-display font-bold tracking-tight text-slate-900 ${className}`}>
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white p-1.5 shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={s.icon} height={s.icon} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          {/* Route pin: a path with two location dots */}
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="5" r="2" />
          <path d="M18 7v5a4 4 0 0 1-4 4H10a4 4 0 0 0-4 4" />
        </svg>
      </span>
      <span className={`${s.text} leading-none`}>
        Ride<span className="text-indigo-600">Sync</span>
      </span>
    </span>
  )

  if (to) {
    return (
      <Link to={to} data-testid="brand-logo" className="inline-flex">
        {content}
      </Link>
    )
  }
  return content
}
