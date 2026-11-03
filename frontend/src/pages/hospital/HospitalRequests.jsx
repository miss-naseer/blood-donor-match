import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Alert, BloodGroup, Button, EmptyState, Field, Input, Loading, PageHeader, Select, StatusBadge, Textarea, UrgencyBadge } from '../../components/ui'
import { errorMessage, formatDate, formatTime, today } from '../../utils/format'

// Which statuses appear under each filter
const FILTERS = {
  action: { label: 'Needs action', test: (r) => (r.status === 'pending' && r.initiated_by === 'donor') || ['approved', 'reschedule_requested', 'confirmed'].includes(r.status) },
  waiting: { label: 'Waiting for donors', test: (r) => (r.status === 'pending' && r.initiated_by === 'hospital') || r.status === 'scheduled' },
  closed: { label: 'Closed', test: (r) => ['completed', 'declined', 'cancelled'].includes(r.status) },
  all: { label: 'All requests', test: () => true },
}

export default function HospitalRequests() {
  const [requests, setRequests] = useState(null)
  const [filter, setFilter] = useState('action')
  const [error, setError] = useState('')

  function load() {
    api.get('/donations/requests/hospital/').then((res) => setRequests(res.data))
  }
  useEffect(load, [])

  async function act(url, body = {}) {
    setError('')
    try {
      await api.post(url, body)
      load()
      return true
    } catch (err) {
      setError(errorMessage(err))
      return false
    }
  }

  if (!requests) return <Loading />
  const shown = requests.filter(FILTERS[filter].test)

  return (
    <>
      <PageHeader
        title="Donation requests"
        description="Review donor requests, schedule donations and record completed ones."
        action={
          <div className="w-52">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {Object.entries(FILTERS).map(([key, f]) => <option key={key} value={key}>{f.label}</option>)}
            </Select>
          </div>
        }
      />
      <Alert>{error}</Alert>
      {shown.length === 0 ? (
        <EmptyState title="No requests here">Try another filter, or request donors when you need blood.</EmptyState>
      ) : (
        <div className="space-y-4">{shown.map((r) => <RequestCard key={r.id} r={r} act={act} />)}</div>
      )}
    </>
  )
}

function RequestCard({ r, act }) {
  const [open, setOpen] = useState('') // which form is open: 'decline' | 'schedule' | 'complete' | 'cancel'
  const [form, setForm] = useState({
    scheduled_date: r.appointment?.scheduled_date || '',
    scheduled_time: r.appointment?.scheduled_time?.slice(0, 5) || '',
    instructions: r.appointment?.instructions || '',
    reason: '',
    donation_date: today(),
    quantity_ml: 450,
    remarks: '',
  })
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const d = r.donor
  const base = `/donations/requests/${r.id}`

  async function submit(url, body) {
    if (await act(url, body)) setOpen('')
  }

  return (
    <article className="rounded-md border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <BloodGroup group={d.blood_group} />
          <div>
            <h2 className="font-semibold">{d.full_name}</h2>
            <p className="text-sm text-muted">
              {r.initiated_by === 'donor' ? 'Donor asked to donate' : `You requested ${r.blood_group_needed} blood`} on {formatDate(r.created_at)}
              {d.city && `. Lives in ${d.city}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UrgencyBadge level={r.urgency_level} label={r.urgency_label} />
          <StatusBadge status={r.status} label={r.status_label} />
        </div>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Detail label={r.initiated_by === 'donor' ? 'Preferred date' : 'Needed by'} value={formatDate(r.required_date)} />
        <Detail label="Eligible now" value={d.is_eligible ? 'Yes' : `No, from ${formatDate(d.next_eligible_date)}`} />
        {d.phone !== undefined && <Detail label="Phone" value={d.phone || '-'} />}
        {d.email !== undefined && <Detail label="Email" value={d.email} />}
        {d.health_conditions && <Detail label="Health conditions" value={d.health_conditions} />}
        {r.reason && <Detail label="Note" value={r.reason} />}
        {r.appointment && <Detail label="Appointment" value={`${formatDate(r.appointment.scheduled_date)} at ${formatTime(r.appointment.scheduled_time)}`} />}
        {r.status === 'reschedule_requested' && <Detail label="Donor asked for" value={r.appointment?.reschedule_note} />}
        {r.decline_reason && <Detail label="Reason" value={r.decline_reason} />}
      </dl>

      {d.phone === undefined && (
        <p className="mt-2 text-xs text-muted">Contact details are shown once the request is approved or accepted.</p>
      )}

      {/* Buttons for the next step, depending on the status */}
      {!open && (
        <div className="mt-4 flex flex-wrap gap-2">
          {r.status === 'pending' && r.initiated_by === 'donor' && (
            <>
              <Button onClick={() => act(`${base}/review/`, { approve: true })}>Approve</Button>
              <Button variant="secondary" onClick={() => setOpen('decline')}>Decline</Button>
            </>
          )}
          {['approved', 'reschedule_requested'].includes(r.status) && (
            <Button onClick={() => setOpen('schedule')}>Schedule donation</Button>
          )}
          {r.status === 'confirmed' && <Button onClick={() => setOpen('complete')}>Mark as completed</Button>}
          {['approved', 'scheduled', 'reschedule_requested', 'confirmed'].includes(r.status) && (
            <Button variant="danger" onClick={() => setOpen('cancel')}>Cancel</Button>
          )}
        </div>
      )}
      {r.status === 'scheduled' && !open && <p className="mt-2 text-sm text-muted">Waiting for the donor to confirm.</p>}

      {open === 'decline' && (
        <SmallForm onCancel={() => setOpen('')} onSubmit={() => submit(`${base}/review/`, { approve: false, reason: form.reason })} label="Decline request">
          <Field label="Reason (optional)"><Textarea value={form.reason} onChange={set('reason')} /></Field>
        </SmallForm>
      )}

      {open === 'schedule' && (
        <SmallForm onCancel={() => setOpen('')} label="Save appointment"
          onSubmit={() => submit(`${base}/schedule/`, { scheduled_date: form.scheduled_date, scheduled_time: form.scheduled_time, instructions: form.instructions })}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date"><Input type="date" min={today()} required value={form.scheduled_date} onChange={set('scheduled_date')} /></Field>
            <Field label="Time"><Input type="time" required value={form.scheduled_time} onChange={set('scheduled_time')} /></Field>
          </div>
          <Field label="Instructions for the donor"><Textarea value={form.instructions} onChange={set('instructions')} placeholder="For example: eat before coming, bring an ID card." /></Field>
        </SmallForm>
      )}

      {open === 'complete' && (
        <SmallForm onCancel={() => setOpen('')} label="Save donation"
          onSubmit={() => submit(`${base}/complete/`, { donation_date: form.donation_date, quantity_ml: form.quantity_ml, remarks: form.remarks })}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Donation date"><Input type="date" max={today()} value={form.donation_date} onChange={set('donation_date')} /></Field>
            <Field label="Quantity collected (ml)"><Input type="number" min="1" value={form.quantity_ml} onChange={set('quantity_ml')} /></Field>
          </div>
          <Field label="Remarks"><Textarea value={form.remarks} onChange={set('remarks')} /></Field>
        </SmallForm>
      )}

      {open === 'cancel' && (
        <SmallForm onCancel={() => setOpen('')} onSubmit={() => submit(`${base}/cancel/`, { reason: form.reason })} label="Cancel request" danger>
          <Field label="Reason"><Textarea value={form.reason} onChange={set('reason')} placeholder="For example: donor did not attend." /></Field>
        </SmallForm>
      )}
    </article>
  )
}

function SmallForm({ children, onSubmit, onCancel, label, danger }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="mt-4 space-y-3 border-t border-line pt-4">
      {children}
      <div className="flex gap-2">
        <Button type="submit" variant={danger ? 'danger' : 'primary'}>{label}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Back</Button>
      </div>
    </form>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted">{label}:</dt>
      <dd>{value}</dd>
    </div>
  )
}
