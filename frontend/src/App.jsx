import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import RealtimeNotifier from './components/RealtimeNotifier.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Logo from './components/Logo.jsx'
import { useAuth } from './hooks/useAuth.js'
import LoginPage from './pages/LoginPage.jsx'
import RideFeed from './pages/RideFeed.jsx'
import PostRide from './pages/PostRide.jsx'
import RideDetail from './pages/RideDetail.jsx'
import MyDashboard from './pages/MyDashboard.jsx'
import UserProfile from './pages/UserProfile.jsx'
import NotFound from './pages/NotFound.jsx'

function TopBar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <Logo to="/" size="md" />
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          {user ? (
            <>
              <Link
                to="/feed"
                data-testid="topbar-feed-link"
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Feed
              </Link>
              <Link
                to="/dashboard"
                data-testid="topbar-dashboard-link"
                className="hidden sm:inline-flex items-center px-3 py-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Dashboard
              </Link>
              {/* Quick Post Ride button instead of notification bell */}
              <Link
                to="/post-ride"
                data-testid="topbar-post-ride-link"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition font-medium"
                title="Post a new ride"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="hidden sm:inline">Post Ride</span>
              </Link>
              <Link
                to={`/profile/${user.id}`}
                data-testid="topbar-profile-link"
                className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-100 transition"
                title={user.email}
              >
                <span
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-xs font-semibold flex items-center justify-center shadow-sm"
                >
                  {(user.email?.[0] ?? '?').toUpperCase()}
                </span>
                <span className="hidden lg:inline text-slate-700 max-w-[18ch] truncate" data-testid="topbar-user-email">
                  {user.email}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                data-testid="topbar-signout-button"
                className="ml-1 px-3.5 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 transition text-xs sm:text-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              data-testid="topbar-login-link"
              className="px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

function Home() {
  const { user } = useAuth()
  return (
    <div
      data-testid="home-hero"
      className="relative overflow-hidden min-h-[calc(100vh-65px)]"
    >
      {/* Decorative gradient blobs */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 w-[26rem] h-[26rem] rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute top-32 -right-24 w-[22rem] h-[22rem] rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[18rem] h-[18rem] rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28">
        <div className="animate-slide-up max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            A closed community for SST students
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Carpool to exams, trips,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              airports & anywhere
            </span>{' '}
            with your classmates.
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">
            Post a ride you&apos;re driving, or grab an empty seat heading your way.
            Coordinate over WhatsApp, split the cost, skip the awkward ride shares with strangers.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={user ? '/feed' : '/login'}
              data-testid="home-find-ride-cta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-medium shadow-sm hover:bg-slate-800 active:bg-slate-950 transition"
            >
              Find a ride
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link
              to={user ? '/post-ride' : '/login'}
              data-testid="home-post-ride-cta"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-medium hover:border-slate-400 shadow-sm transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Post a ride
            </Link>
          </div>
        </div>

        {/* Feature tiles */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          {[
            {
              title: 'Verified classmates',
              body: 'Only @sst.scaler.com emails. No strangers, no sketchy drivers.',
              icon: (
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
              ),
              accent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
            },
            {
              title: 'Real-time seats',
              body: 'Live seat counter updates the moment someone joins.',
              icon: (
                <>
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                </>
              ),
              accent: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
            },
            {
              title: 'Chat on WhatsApp',
              body: 'One tap to the host — no new inboxes to check.',
              icon: (
                <>
                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                </>
              ),
              accent: 'bg-sky-50 text-sky-700 ring-sky-200',
            },
          ].map((f, i) => (
            <div
              key={i}
              data-testid={`home-feature-${i}`}
              className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition"
            >
              <div className={`w-10 h-10 rounded-xl ring-1 inline-flex items-center justify-center ${f.accent}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Shell() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/feed" element={<ProtectedRoute><RideFeed /></ProtectedRoute>} />
          <Route path="/post-ride" element={<ProtectedRoute><PostRide /></ProtectedRoute>} />
          <Route path="/ride/:id" element={<ProtectedRoute><RideDetail /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><MyDashboard /></ProtectedRoute>} />
          <Route path="/profile/:uid" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <RealtimeNotifier />
          <Shell />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
