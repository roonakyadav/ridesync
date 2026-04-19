import { Component } from 'react'

/**
 * Catches render errors anywhere in the subtree and shows a friendly
 * fallback instead of a blank white screen. Must be a class component —
 * React doesn't have a hook-based error boundary yet.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] captured:', error, info?.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.error) return this.props.children

    const isDev = import.meta.env.DEV

    return (
      <div
        data-testid="error-boundary-fallback"
        className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10"
      >
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Something broke</h1>
          <p className="mt-2 text-sm text-slate-600">
            RideSync hit an unexpected error while rendering this page. Reloading usually fixes it.
          </p>
          {isDev && this.state.error?.message && (
            <pre
              data-testid="error-boundary-message"
              className="mt-4 text-xs bg-slate-100 text-slate-800 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap break-words"
            >
              {String(this.state.error.message)}
            </pre>
          )}
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              data-testid="error-boundary-reload"
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Reload page
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              data-testid="error-boundary-home"
              className="px-4 py-2 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              Go to home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
