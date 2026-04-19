import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

const ToastContext = createContext({
  showToast: () => 0,
  dismiss: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ kind = 'info', title, body, linkTo, duration = 5000 }) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, kind, title, body, linkTo }])
      if (duration > 0) {
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }
      return id
    },
    []
  )

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastHost({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div
      data-testid="toast-host"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const KIND_STYLES = {
  success: 'border-emerald-200 bg-emerald-50',
  info:    'border-slate-200 bg-white',
  error:   'border-rose-200 bg-rose-50',
}
const KIND_ACCENT = {
  success: 'bg-emerald-500',
  info:    'bg-slate-500',
  error:   'bg-rose-500',
}

function ToastItem({ toast, onDismiss }) {
  const body = (
    <div
      data-testid={`toast-${toast.kind}`}
      className={`relative pl-4 pr-8 py-3 rounded-xl border shadow-sm text-sm ${KIND_STYLES[toast.kind] || KIND_STYLES.info}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${KIND_ACCENT[toast.kind] || KIND_ACCENT.info}`} />
      {toast.title && <div className="font-semibold text-slate-900">{toast.title}</div>}
      {toast.body && <div className="text-slate-700 mt-0.5">{toast.body}</div>}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDismiss(toast.id)
        }}
        data-testid={`toast-${toast.id}-dismiss`}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 text-xs leading-none px-1"
      >
        ✕
      </button>
    </div>
  )

  if (toast.linkTo) {
    return (
      <Link to={toast.linkTo} onClick={() => onDismiss(toast.id)} className="block">
        {body}
      </Link>
    )
  }
  return body
}

export default ToastProvider
