import { useEffect, useState } from 'react'
import api from '../api/client'
import { BloodGroup, EmptyState, Loading, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/format'

export default function History() {
  const { user } = useAuth()
  const [records, setRecords] = useState(null)
  const isDonor = user.role === 'donor'

  useEffect(() => {
    api.get('/records/mine/').then((res) => setRecords(res.data))
  }, [])

  if (!records) return <Loading />

  const totalMl = records.reduce((sum, r) => sum + r.quantity_ml, 0)

  return (
    <>
      <PageHeader
        title="Donation history"
        description={isDonor ? 'Every donation you have completed on the platform.' : 'Donations completed at your hospital.'}
      />
      {records.length === 0 ? (
        <EmptyState title="No completed donations yet">
          Donations appear here once the hospital marks them as completed.
        </EmptyState>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {records.length} donation{records.length === 1 ? '' : 's'}, {totalMl.toLocaleString()} ml in total
          </p>
          <div className="overflow-x-auto rounded-md border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">{isDonor ? 'Hospital' : 'Donor'}</th>
                  <th className="px-4 py-3 font-medium">Blood group</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(r.donation_date)}</td>
                    <td className="px-4 py-3">{isDonor ? r.hospital_name : r.donor_name}</td>
                    <td className="px-4 py-3"><BloodGroup group={r.blood_group} /></td>
                    <td className="px-4 py-3">{r.quantity_ml} ml</td>
                    <td className="px-4 py-3 text-muted">{r.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
