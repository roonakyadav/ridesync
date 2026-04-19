/**
 * Friendly empty-state card with an illustrative icon + CTA.
 *
 * Props:
 *   icon       : 'search' | 'car' | 'inbox' | 'user' (defaults to 'inbox')
 *   title      : string
 *   body       : string
 *   ctaLabel   : string (optional)
 *   ctaTo      : string (optional, react-router Link path)
 *   onCtaClick : () => void (optional, alternate to ctaTo)
 *   testId     : string (defaults to 'empty-state')
 */
import { Link } from 'react-router-dom'

const ICONS = {
  search: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  car: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
      <circle cx="6.5" cy="16.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </svg>
  ),
  inbox: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  user: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

export default function EmptyState({
  icon = 'inbox',
  title,
  body,
  ctaLabel,
  ctaTo,
  onCtaClick,
  testId = 'empty-state',
}) {
  return (
    <div
      data-testid={testId}
      className="text-center py-10 sm:py-14 px-6 border border-dashed border-slate-300 rounded-2xl bg-white"
    >
      <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
        {ICONS[icon] ?? ICONS.inbox}
      </div>
      {title && <p className="mt-4 text-slate-900 font-medium">{title}</p>}
      {body && <p className="mt-1 text-sm text-slate-600 max-w-sm mx-auto">{body}</p>}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          data-testid={`${testId}-cta`}
          className="mt-5 inline-block px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && !ctaTo && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          data-testid={`${testId}-cta`}
          className="mt-5 inline-block px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
