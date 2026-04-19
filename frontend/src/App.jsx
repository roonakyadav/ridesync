import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import NotificationBell from './components/NotificationBell.jsx'
import RealtimeNotifier from './components/RealtimeNotifier.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
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
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <Link to="/" data-testid="topbar-brand" className="font-semibold text-slate-900 shrink-0">
          RideSync
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3 text-sm">
          {user ? (
            <>
              <Link to="/feed" className="text-slate-700 hover:text-slate-900" data-testid="topbar-feed-link">
                Feed
              </Link>
              <Link to="/dashboard" className="text-slate-700 hover:text-slate-900" data-testid="topbar-dashboard-link">
                Dashboard
              </Link>
              <NotificationBell />
              <Link
                to={`/profile/${user.id}`}
                data-testid="topbar-profile-link"
                className="hidden sm:inline text-slate-700 hover:text-slate-900"
              >
                Profile
              </Link>
              <span className="text-slate-400 hidden lg:inline truncate max-w-[16ch]" data-testid="topbar-user-email">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                data-testid="topbar-signout-button"
                className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              data-testid="topbar-login-link"
              className="px-3 py-1.5 rounded-full bg-slate-900 text-white"
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
  const { user, loading } = useAuth()
  return (
    <div
      data-testid="home-hero"
      className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6"
    >
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">RideSync</h1>
      <p className="mt-3 text-slate-600 max-w-xl text-center">
        Carpool with your SST classmates. Post rides, join trips, split costs.
      </p>
      <div className="mt-6 flex gap-3">
        {!loading && user ? (
          <Link
            to="/feed"
            data-testid="home-feed-link"
            className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm"
          >
            Open ride feed
          </Link>
        ) : (
          <Link
            to="/login"
            data-testid="home-login-link"
            className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm"
          >
            Sign in with magic link
          </Link>
        )}
      </div>
    </div>
  )
}

function Shell() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <RideFeed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-ride"
            element={
              <ProtectedRoute>
                <PostRide />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ride/:id"
            element={
              <ProtectedRoute>
                <RideDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:uid"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
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
