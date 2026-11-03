import { useState } from 'react'
import api from '../../api/client'
import { Alert, BloodGroup, Button, Field, Input, PageHeader, Panel, Select, Textarea } from '../../components/ui'
import { BLOOD_GROUPS, COMPATIBLE_DONORS, errorMessage, today } from '../../utils/format'

export default function SendRequest() {
  const [form, setForm] = useState({ blood_group_needed: '', urgency_level: 'normal', reason: '', required_date: '' })
  const [message, setMessage] = useState({ kind: '', text: '' })
  const [sending, setSending] = useState(false)
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    setMessage({ kind: '', text: '' })
    try {
      const res = await api.post('/donations/requests/send/', form)
      const n = res.data.donors_contacted
      setMessage({ kind: 'success', text: `Request sent to ${n} compatible donor${n === 1 ? '' : 's'}. You will be notified when they respond.` })
      setForm({ blood_group_needed: '', urgency_level: 'normal', reason: '', required_date: '' })
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  const compatible = COMPATIBLE_DONORS[form.blood_group_needed] || []

  return (
    <>
      <PageHeader
        title="Request donors"
        description="The request goes to donors with a compatible blood group who are available and eligible to donate."
      />
      <Alert kind={message.kind}>{message.text}</Alert>
      <div className="grid gap-6 md:grid-cols-3">
        <Panel className="md:col-span-2">
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Blood group needed">
              <Select required value={form.blood_group_needed} onChange={set('blood_group_needed')}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
              </Select>
            </Field>
            <Field label="Urgency">
              <Select value={form.urgency_level} onChange={set('urgency_level')}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </Select>
            </Field>
            <Field label="Needed by">
              <Input type="date" required min={today()} value={form.required_date} onChange={set('required_date')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Reason" hint="Donors see this, so keep patient details private.">
                <Textarea value={form.reason} onChange={set('reason')} placeholder="For example: blood needed for scheduled surgeries." />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send request'}</Button>
            </div>
          </form>
        </Panel>

        <Panel title="Who will be asked">
          {compatible.length === 0 ? (
            <p className="text-sm text-muted">Choose a blood group to see which donor groups are compatible.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">A patient needing {form.blood_group_needed} can receive from:</p>
              <div className="flex flex-wrap gap-2">
                {compatible.map((g) => <BloodGroup key={g} group={g} />)}
              </div>
            </>
          )}
        </Panel>
      </div>
    </>
  )
}
