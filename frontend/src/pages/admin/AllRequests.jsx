import { useEffect, useState } from 'react'
import api from '../../api/client'
import { BloodGroup, EmptyState, Loading, PageHeader, Select, StatusBadge } from '../../components/ui'
import { formatDate } from '../../utils/format'

const STATUSES = ['pending', 'approved', 'declined', 'scheduled', 'reschedule_requested', 'confirmed', 'completed', 'cancelled']

export default function AllRequests() {
  const [status, setStatus] = useState('')
  const [requests, setRequests] = useState(null)

  useEffect(() => {
    setRequests(null)
    api.get('/donations/admin/requests/', { params: status ? { status } : {} }).then((res) => setRequests(res.data))
  }, [status])

  return (
    <>
      <PageHeader
        title="All requests"
        description="Every donation request on the platform (latest 200)."
        action={
          <div className="w-52">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          </div>
        }
      />
      {!requests ? (
        <Loading />
      ) : requests.length === 0 ? (
        <EmptyState title="No requests found" />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Hospital</th>
                <th className="px-4 py-3 font-medium">Started by</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2"><BloodGroup group={r.donor.blood_group} /> {r.donor.full_name}</span>
                  </td>
                  <td className="px-4 py-3">{r.hospital.name}</td>
                  <td className="px-4 py-3 capitalize">{r.initiated_by}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} label={r.status_label} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
