/*
  The hospital details form. Used both to register a new hospital
  and to edit an existing one (HospitalDashboard).
*/
import { useState } from 'react'
import { Button, Field, Input, Textarea } from '../../components/ui'
import { BLOOD_GROUPS } from '../../utils/format'

const EMPTY = { name: '', address: '', city: '', phone: '', email: '', blood_bank_details: '', blood_groups_needed: [] }

export default function HospitalForm({ initial, submitLabel, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  function toggleGroup(group) {
    const groups = form.blood_groups_needed.includes(group)
      ? form.blood_groups_needed.filter((g) => g !== group)
      : [...form.blood_groups_needed, group]
    setForm({ ...form, blood_groups_needed: groups })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { name, address, city, phone, email, blood_bank_details, blood_groups_needed } = form
    await onSubmit({ name, address, city, phone, email, blood_bank_details, blood_groups_needed })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <Field label="Hospital name"><Input required value={form.name} onChange={set('name')} /></Field>
      </div>
      <Field label="Address"><Input required value={form.address} onChange={set('address')} /></Field>
      <Field label="City"><Input required value={form.city} onChange={set('city')} /></Field>
      <Field label="Phone number"><Input required value={form.phone} onChange={set('phone')} /></Field>
      <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
      <div className="md:col-span-2">
        <Field label="Blood bank details" hint="For example opening hours and where donors should go.">
          <Textarea value={form.blood_bank_details} onChange={set('blood_bank_details')} />
        </Field>
      </div>
      <fieldset className="md:col-span-2">
        <legend className="mb-2 text-sm font-medium">Blood groups currently needed</legend>
        <div className="flex flex-wrap gap-2">
          {BLOOD_GROUPS.map((g) => {
            const on = form.blood_groups_needed.includes(g)
            return (
              <button
                type="button"
                key={g}
                onClick={() => toggleGroup(g)}
                aria-pressed={on}
                className={`h-9 min-w-12 rounded-md border-2 px-2 text-sm font-bold ${on ? 'border-blood bg-blood text-white' : 'border-line text-muted hover:border-blood'}`}
              >
                {g}
              </button>
            )
          })}
        </div>
      </fieldset>
      <div className="md:col-span-2">
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  )
}
