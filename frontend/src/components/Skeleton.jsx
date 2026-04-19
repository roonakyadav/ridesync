/**
 * Minimal pulsing skeleton primitive. Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton.Card />
 */
export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
}

Skeleton.Card = function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-slate-200 rounded-full" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
          <div className="h-5 w-3/4 bg-slate-200 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 rounded" />
        </div>
        <div className="shrink-0 space-y-2 text-right">
          <div className="h-8 w-10 bg-slate-200 rounded ml-auto" />
          <div className="h-3 w-14 bg-slate-100 rounded ml-auto" />
        </div>
      </div>
    </div>
  )
}

Skeleton.Row = function SkeletonRow() {
  return (
    <div
      aria-hidden="true"
      className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse flex items-center justify-between gap-3"
    >
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
        <div className="h-3 w-1/3 bg-slate-100 rounded" />
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full shrink-0" />
    </div>
  )
}
