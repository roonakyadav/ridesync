import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div
      data-testid="not-found-page"
      className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center bg-slate-50 px-6 text-center"
    >
      <div className="text-7xl sm:text-8xl font-display font-extrabold text-slate-200 tracking-tight">404</div>
      <h2 className="mt-2 text-2xl font-display font-bold text-slate-900">Page not found</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-sm">
        That URL led nowhere. Maybe the ride was cancelled, or the link&apos;s gone stale.
      </p>
      <Link
        to="/"
        data-testid="not-found-home-link"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800 transition shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="19 12 12 19 5 12" transform="rotate(90 12 12)" />
          <line x1="19" y1="12" x2="5" y2="12" />
        </svg>
        Back to home
      </Link>
    </div>
  )
}
