import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { BloodGroup, Loading, PageHeader, Panel, Stat } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/donations/admin/stats/').then((res) => setStats(res.data))
  }, [])

  if (!stats) return <Loading />

  const maxCount = Math.max(1, ...Object.values(stats.donors_by_blood_group))

  return (
    <>
      <PageHeader title="Admin dashboard" description="An overview of donors, hospitals and donation activity." />

      {stats.hospitals_pending > 0 && (
        <Link to="/admin/hospitals" className="mb-6 block rounded-md border border-blood bg-blood-soft px-4 py-3 text-sm font-medium text-blood-dark hover:underline">
          {stats.hospitals_pending} hospital{stats.hospitals_pending === 1 ? ' is' : 's are'} waiting for verification
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered donors" value={stats.donors} />
        <Stat label="Donors available now" value={stats.available_donors} />
        <Stat label="Verified hospitals" value={stats.hospitals_verified} />
        <Stat label="Hospital managers" value={stats.hospital_managers} />
        <Stat label="Open requests" value={stats.requests_open} />
        <Stat label="All requests" value={stats.requests_total} />
        <Stat label="Completed donations" value={stats.donations_completed} />
        <Stat label="Hospitals pending" value={stats.hospitals_pending} />
      </div>

      <Panel title="Donors by blood group" className="mt-6">
        <ul className="space-y-2">
          {Object.entries(stats.donors_by_blood_group).map(([group, count]) => (
            <li key={group} className="flex items-center gap-3">
              <BloodGroup group={group} />
              <div className="h-3 flex-1 rounded bg-canvas">
                <div className="h-3 rounded bg-blood" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
              <span className="w-8 text-right text-sm">{count}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}
