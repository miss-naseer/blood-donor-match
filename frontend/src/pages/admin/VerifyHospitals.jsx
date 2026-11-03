import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Alert, Button, EmptyState, Field, Loading, PageHeader, Select, StatusBadge, Textarea } from '../../components/ui'
import { errorMessage, formatDate } from '../../utils/format'

export default function VerifyHospitals() {
  const [status, setStatus] = useState('pending')
  const [hospitals, setHospitals] = useState(null)
  const [rejecting, setRejecting] = useState(null) // id of hospital being rejected
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState({ kind: '', text: '' })

  function load(s = status) {
    setHospitals(null)
    api.get('/hospitals/admin/', { params: s ? { status: s } : {} }).then((res) => setHospitals(res.data))
  }
  useEffect(() => load(status), [status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function decide(hospital, action) {
    setMessage({ kind: '', text: '' })
    try {
      await api.post(`/hospitals/${hospital.id}/verify/`, { action, reason })
      setMessage({ kind: 'success', text: `${hospital.name} ${action === 'verify' ? 'verified' : 'rejected'}.` })
      setRejecting(null)
      setReason('')
      load()
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) })
    }
  }

  return (
    <>
      <PageHeader
        title="Verify hospitals"
        description="Check each hospital's details before it becomes visible to donors."
        action={
          <div className="w-48">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </Select>
          </div>
        }
      />
      <Alert kind={message.kind}>{message.text}</Alert>

      {!hospitals ? (
        <Loading />
      ) : hospitals.length === 0 ? (
        <EmptyState title="No hospitals in this list" />
      ) : (
        <div className="space-y-4">
          {hospitals.map((h) => (
            <article key={h.id} className="rounded-md border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{h.name}</h2>
                  <p className="text-sm text-muted">{h.address}, {h.city}</p>
                </div>
                <StatusBadge status={h.verification_status} label={h.status_label} />
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div><dt className="inline text-muted">Manager: </dt><dd className="inline">{h.manager_name}</dd></div>
                <div><dt className="inline text-muted">Registered: </dt><dd className="inline">{formatDate(h.created_at)}</dd></div>
                <div><dt className="inline text-muted">Phone: </dt><dd className="inline">{h.phone}</dd></div>
                <div><dt className="inline text-muted">Email: </dt><dd className="inline">{h.email}</dd></div>
                {h.blood_bank_details && (
                  <div className="sm:col-span-2"><dt className="inline text-muted">Blood bank: </dt><dd className="inline">{h.blood_bank_details}</dd></div>
                )}
                {h.rejection_reason && (
                  <div className="sm:col-span-2"><dt className="inline text-muted">Rejection reason: </dt><dd className="inline">{h.rejection_reason}</dd></div>
                )}
              </dl>

              {h.verification_status !== 'verified' && rejecting !== h.id && (
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => decide(h, 'verify')}>Verify hospital</Button>
                  {h.verification_status === 'pending' && (
                    <Button variant="secondary" onClick={() => setRejecting(h.id)}>Reject</Button>
                  )}
                </div>
              )}

              {rejecting === h.id && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <Field label="Reason for rejecting (sent to the hospital manager)">
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="danger" onClick={() => decide(h, 'reject')}>Reject hospital</Button>
                    <Button variant="secondary" onClick={() => setRejecting(null)}>Back</Button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
