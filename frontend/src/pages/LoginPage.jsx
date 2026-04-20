import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { validateEmailDomain, ALLOWED_EMAIL_DOMAIN } from '../services/authService.js'
import Logo from '../components/Logo.jsx'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const { user, loading, signInWithMagicLink } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && user) {
      const from = location.state?.from?.pathname || '/feed'
      navigate(from, { replace: true })
    }
  }, [user, loading, location.state, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const v = validateEmailDomain(email)
    if (!v.valid) { setError(v.error); return }
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
      className="relative min-h-[calc(100vh-65px)] flex items-center justify-center px-4 sm:px-6 py-10 overflow-hidden"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-24 w-[22rem] h-[22rem] rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-[18rem] h-[18rem] rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up">
        <div className="flex justify-center mb-6 sm:hidden">
          <Logo size="md" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-card p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Sign in to RideSync
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Use your <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">@{ALLOWED_EMAIL_DOMAIN}</code> email.
            We&apos;ll email you a one-time magic link — no passwords.
          </p>

          {submitted ? (
            <div
              data-testid="login-sent-state"
              className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-emerald-900">Check your inbox</p>
                  <p className="mt-1 text-emerald-800 break-words">
                    We sent a magic link to <strong>{email}</strong>.
                  </p>
                  <button
                    type="button"
                    data-testid="login-try-another"
                    onClick={() => { setSubmitted(false); setEmail(''); setError(null) }}
                    className="mt-3 text-emerald-900 underline underline-offset-2 text-sm font-medium"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Your email
                </label>
                <div className="relative">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null) }}
                    placeholder={`you@${ALLOWED_EMAIL_DOMAIN}`}
                    disabled={sending}
                    data-testid="login-email-input"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 outline-none disabled:bg-slate-100 transition"
                    required
                  />
                </div>
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
                className="w-full rounded-full bg-slate-900 text-white text-sm font-medium py-3 hover:bg-slate-800 active:bg-slate-950 transition disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
              >
                {sending ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500 text-center">
          Domain-locked to SST students. Non-@{ALLOWED_EMAIL_DOMAIN} addresses are rejected.
        </p>
        <p className="mt-2 text-xs text-slate-400 text-center">
          <Link to="/" className="hover:text-slate-600">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
