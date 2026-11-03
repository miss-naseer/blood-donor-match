import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Alert, Button, EmptyState, Field, Loading, PageHeader, StatusBadge, Textarea, UrgencyBadge } from '../../components/ui'
import { errorMessage, formatDate, formatTime } from '../../utils/format'

export default function MyRequests() {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.get('/donations/requests/mine/').then((res) => setRequests(res.data))
  }
  useEffect(load, [])

  // Runs an action (accept, confirm...) then reloads the list
  async function act(url, body = {}) {
    setError('')
    try {
      await api.post(url, body)
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (!requests) return <Loading />

  return (
    <>
      <PageHeader title="My requests" description="Requests you sent to hospitals, and requests hospitals sent to you." />
      <Alert>{error}</Alert>
      {requests.length === 0 ? (
        <EmptyState title="No requests yet">Find a hospital and send a request to donate.</EmptyState>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => <RequestItem key={r.id} r={r} act={act} />)}
        </div>
      )}
    </>
  )
}

function RequestItem({ r, act }) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [note, setNote] = useState('')
  const fromHospital = r.initiated_by === 'hospital'

  return (
    <article className="rounded-md border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">
            {fromHospital ? 'Request from hospital' : 'You asked to donate'} on {formatDate(r.created_at)}
          </p>
          <h2 className="mt-1 font-semibold">{r.hospital.name}</h2>
          <p className="text-sm text-muted">{r.hospital.address}, {r.hospital.city}. Phone: {r.hospital.phone}</p>
        </div>
        <div className="flex items-center gap-2">
          <UrgencyBadge level={r.urgency_level} label={r.urgency_label} />
          <StatusBadge status={r.status} label={r.status_label} />
        </div>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {fromHospital && <Detail label="Blood group needed" value={r.blood_group_needed} />}
        <Detail label={fromHospital ? 'Needed by' : 'Preferred date'} value={formatDate(r.required_date)} />
        {r.reason && <Detail label={fromHospital ? 'Reason' : 'Your note'} value={r.reason} />}
        {r.decline_reason && <Detail label="Reason given" value={r.decline_reason} />}
        {r.appointment && (
          <>
            <Detail label="Appointment" value={`${formatDate(r.appointment.scheduled_date)} at ${formatTime(r.appointment.scheduled_time)}`} />
            {r.appointment.instructions && <Detail label="Instructions" value={r.appointment.instructions} />}
          </>
        )}
      </dl>

      {/* Actions depend on the status */}
      {fromHospital && r.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => act(`/donations/requests/${r.id}/respond/`, { accept: true })}>Accept</Button>
          <Button variant="secondary" onClick={() => act(`/donations/requests/${r.id}/respond/`, { accept: false })}>Decline</Button>
        </div>
      )}

      {r.status === 'scheduled' && !showReschedule && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => act(`/donations/requests/${r.id}/confirm/`)}>Confirm appointment</Button>
          <Button variant="secondary" onClick={() => setShowReschedule(true)}>Ask for another time</Button>
        </div>
      )}

      {showReschedule && r.status === 'scheduled' && (
        <div className="mt-4 space-y-2">
          <Field label="Which date or time works better for you?">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button onClick={() => act(`/donations/requests/${r.id}/reschedule/`, { note })}>Send</Button>
            <Button variant="secondary" onClick={() => setShowReschedule(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {r.status === 'reschedule_requested' && (
        <p className="mt-4 text-sm text-muted">Waiting for the hospital to choose a new time.</p>
      )}
      {r.status === 'approved' && (
        <p className="mt-4 text-sm text-muted">Waiting for the hospital to set a date and time.</p>
      )}
    </article>
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
