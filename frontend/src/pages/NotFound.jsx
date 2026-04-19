import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div data-testid="not-found-page" className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900">
      <h2 className="text-3xl font-semibold">404</h2>
      <p className="mt-2 text-slate-600">Page not found.</p>
      <Link to="/" data-testid="not-found-home-link" className="mt-4 text-slate-900 underline">Go home</Link>
    </div>
  )
}
