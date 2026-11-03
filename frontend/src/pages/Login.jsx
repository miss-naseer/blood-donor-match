import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert, Button, Field, Input } from '../components/ui'
import { homePath, useAuth } from '../context/AuthContext'
import { errorMessage } from '../utils/format'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={homePath(user.role)} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedIn = await login(form.email, form.password)
      navigate(homePath(loggedIn.role))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Log in" subtitle="Connecting verified hospitals with voluntary blood donors.">
      <Alert>{error}</Alert>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="font-medium text-blood hover:underline">Create an account</Link>
      </p>
    </AuthShell>
  )
}

// Shared frame for the login and register pages
export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-12 md:items-center">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-sm bg-blood" aria-hidden="true" />
          <span className="font-semibold">Blood Donor Match</span>
        </div>
        <div className="rounded-md border border-line bg-white p-6 md:p-8">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
