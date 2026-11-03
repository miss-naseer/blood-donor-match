import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Alert, Button, Field, Input, Loading, PageHeader, Panel, Select, Textarea } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { BLOOD_GROUPS, errorMessage, today } from '../../utils/format'

export default function DonorProfile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState({ kind: '', text: '' })

  useEffect(() => {
    api.get('/donors/me/').then((res) => setForm({ ...res.data, full_name: user.full_name, phone: user.phone || '' }))
  }, [user.full_name, user.phone])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage({ kind: '', text: '' })
    try {
      // Name and phone belong to the user account; the rest to the donor profile
      const userRes = await api.patch('/auth/me/', { full_name: form.full_name, phone: form.phone })
      updateUser(userRes.data)
      await api.patch('/donors/me/', {
        blood_group: form.blood_group,
        gender: form.gender,
        date_of_birth: form.date_of_birth || null,
        address: form.address,
        city: form.city,
        health_conditions: form.health_conditions,
        last_donation_date: form.last_donation_date || null,
      })
      setMessage({ kind: 'success', text: 'Profile saved.' })
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) })
    }
  }

  if (!form) return <Loading />

  return (
    <>
      <PageHeader title="My profile" description="Hospitals use these details to check that you can donate." />
      <Alert kind={message.kind}>{message.text}</Alert>
      <Panel>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Full name"><Input required value={form.full_name} onChange={set('full_name')} /></Field>
          <Field label="Phone number"><Input value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Blood group">
            <Select value={form.blood_group} onChange={set('blood_group')}>
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
          <Field label="Date of birth"><Input type="date" value={form.date_of_birth || ''} onChange={set('date_of_birth')} /></Field>
          <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
          <div className="md:col-span-2">
            <Field label="Address"><Input value={form.address} onChange={set('address')} /></Field>
          </div>
          <Field label="Last donation date" hint="Used to work out when you can donate again. Leave empty if you have never donated.">
            <Input type="date" max={today()} value={form.last_donation_date || ''} onChange={set('last_donation_date')} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Health conditions" hint="Only shown to hospitals you are dealing with.">
              <Textarea value={form.health_conditions} onChange={set('health_conditions')} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      </Panel>
    </>
  )
}
