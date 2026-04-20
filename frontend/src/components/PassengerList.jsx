import { Link } from 'react-router-dom'

const STATUS_STYLES = {
  confirmed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  pending:   'bg-amber-50 text-amber-800 ring-amber-200',
  declined:  'bg-rose-50 text-rose-700 ring-rose-200',
}

const STATUS_LABEL = {
  confirmed: 'Confirmed',
  pending:   'Pending',
  declined:  'Declined',
}

function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
}

export default function PassengerList({
  passengers, isHost, currentUserId,
  onAccept, onDecline, onRemove, onWithdraw, pendingAction,
}) {
  if (!passengers?.length) {
    return (
      <div
        data-testid="passenger-list-empty"
        className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl px-4 py-8 text-center"
      >
        No passengers yet.
      </div>
    )
  }

  const order = { pending: 0, confirmed: 1, declined: 2 }
  const rows = [...passengers].sort((a, b) => {
    const s = (order[a.status] ?? 99) - (order[b.status] ?? 99)
    if (s !== 0) return s
    return new Date(a.created_at) - new Date(b.created_at)
  })

  return (
    <ul data-testid="passenger-list" className="space-y-2">
      {rows.map((p) => {
        const isMe = p.user_id === currentUserId
        const name = p.user?.name || p.user?.email || 'Student'
        const busy = pendingAction === p.user_id
        return (
          <li
            key={p.user_id}
            data-testid={`passenger-row-${p.user_id}`}
            className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl shadow-card px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-semibold flex items-center justify-center shadow-sm shrink-0"
              >
                {initials(name)}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/profile/${p.user_id}`}
                    data-testid={`passenger-row-${p.user_id}-profile-link`}
                    className="text-sm font-medium text-slate-900 truncate hover:text-indigo-700 transition"
                  >
                    {name}
                  </Link>
                  {isMe && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-900 text-white">
                      you
                    </span>
                  )}
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ring-1 font-semibold ${STATUS_STYLES[p.status] ?? STATUS_STYLES.declined}`}
                    data-testid={`passenger-row-${p.user_id}-status`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                {p.user?.email && !isMe && (
                  <div className="text-xs text-slate-500 truncate">{p.user.email}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isHost && !isMe && p.status === 'pending' && (
                <>
                  <button
                    type="button" disabled={busy}
                    onClick={() => onAccept?.(p.user_id)}
                    data-testid={`passenger-accept-${p.user_id}`}
                    className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition disabled:bg-emerald-300"
                  >
                    Accept
                  </button>
                  <button
                    type="button" disabled={busy}
                    onClick={() => onDecline?.(p.user_id)}
                    data-testid={`passenger-decline-${p.user_id}`}
                    className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    Decline
                  </button>
                </>
              )}
              {isHost && !isMe && p.status === 'confirmed' && (
                <button
                  type="button" disabled={busy}
                  onClick={() => onRemove?.(p.user_id)}
                  data-testid={`passenger-remove-${p.user_id}`}
                  className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 text-xs hover:bg-rose-50 transition disabled:opacity-50"
                >
                  Remove
                </button>
              )}
              {isMe && (p.status === 'pending' || p.status === 'confirmed') && (
                <button
                  type="button" disabled={busy}
                  onClick={() => onWithdraw?.(p.user_id)}
                  data-testid={`passenger-withdraw-${p.user_id}`}
                  className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Withdraw
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
