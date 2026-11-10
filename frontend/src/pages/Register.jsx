import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Field, Input, Select } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { BLOOD_GROUPS, errorMessage } from '../utils/format'
import { AuthShell } from './Login'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    role: 'donor', full_name: '', email: '', phone: '', password: '',
    blood_group: '', gender: '', date_of_birth: '', city: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const isDonor = form.role === 'donor'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = { 
      role: form.role, 
      full_name: form.full_name, 
      email: form.email, 
      phone: form.phone, 
      password: form.password 
    }

    if (isDonor) {
      payload.blood_group = form.blood_group
      payload.city = form.city
      if (form.gender) payload.gender = form.gender
      if (form.date_of_birth) payload.date_of_birth = form.date_of_birth
    }

    try {
      await register(payload)
      // Redirect to the OTP verification page passing the email as a query parameter
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create an account" subtitle="Register as a blood donor or as a hospital manager.">
      <Alert>{error}</Alert>
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">I am registering as</legend>
          <div className="grid grid-cols-2 gap-2">
            {[['donor', 'A blood donor'], ['hospital_manager', 'A hospital manager']].map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${form.role === value ? 'border-blood bg-blood-soft font-medium text-blood-dark' : 'border-line'}`}
              >
                <input type="radio" name="role" value={value} checked={form.role === value} onChange={set('role')} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Full name"><Input required value={form.full_name} onChange={set('full_name')} /></Field>
        <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone number"><Input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Password" hint="At least 6 characters.">
          <Input type="password" required minLength={6} value={form.password} onChange={set('password')} />
        </Field>

        {isDonor && (
          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <Field label="Blood group">
              <Select required value={form.blood_group} onChange={set('blood_group')}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </Field>
            <Field label="Date of birth"><Input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} /></Field>
            <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
          </div>
        )}

        {!isDonor && (
          <p className="rounded-md bg-canvas px-3 py-2 text-sm text-muted">
            After creating your account you will register your hospital. Donors can see it once the admin verifies it.
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account? <Link to="/login" className="font-medium text-blood hover:underline">Log in</Link>
      </p>
    </AuthShell>
  )
}