import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { validateEmailDomain, ALLOWED_EMAIL_DOMAIN } from '../services/authService.js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const { user, loading, signInWithMagicLink } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // If already signed in, bounce to intended destination (or /feed).
  useEffect(() => {
    if (!loading && user) {
      const from = location.state?.from?.pathname || '/feed'
      navigate(from, { replace: true })
    }
  }, [user, loading, location.state, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const validation = validateEmailDomain(email)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setSending(true)
    const { error: apiError } = await signInWithMagicLink(email)
    setSending(false)

    if (apiError) {
      setError(apiError.message || 'Could not send magic link. Try again.')
      return
    }
    setSubmitted(true)
  }

  return (
    <div
      data-testid="login-page"
      className="min-h-screen flex items-center justify-center bg-slate-50 px-6"
    >
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-slate-900">Sign in to RideSync</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use your <code className="px-1 py-0.5 bg-slate-100 rounded text-xs">@{ALLOWED_EMAIL_DOMAIN}</code> email.
            We&apos;ll send you a one-time magic link.
          </p>

          {submitted ? (
            <div
              data-testid="login-sent-state"
              className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"
            >
              <p className="font-medium">Check your inbox</p>
              <p className="mt-1 text-emerald-800">
                A magic link was sent to <strong>{email}</strong>. Click it to finish signing in.
              </p>
              <button
                type="button"
                data-testid="login-try-another"
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                  setError(null)
                }}
                className="mt-3 text-emerald-900 underline underline-offset-2 text-sm"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  placeholder={`you@${ALLOWED_EMAIL_DOMAIN}`}
                  disabled={sending}
                  data-testid="login-email-input"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none disabled:bg-slate-100"
                  required
                />
              </div>

              {error && (
                <div
                  data-testid="login-error"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !email}
                data-testid="login-submit-button"
                className="w-full rounded-full bg-slate-900 text-white text-sm font-medium py-2.5 transition hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500 text-center">
          Domain-locked to SST students. Non-@{ALLOWED_EMAIL_DOMAIN} addresses are rejected.
        </p>
      </div>
    </div>
  )
}
