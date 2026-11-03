import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Alert, BloodGroup, Button, Loading, PageHeader, Panel, StatusBadge, UrgencyBadge } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { daysUntil, errorMessage, formatDate, formatTime } from '../../utils/format'

export default function DonorDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/donors/me/').then((res) => setProfile(res.data)).catch((err) => setError(errorMessage(err)))
    api.get('/donations/requests/mine/').then((res) => setRequests(res.data))
  }, [])

  async function toggleAvailability() {
    try {
      const res = await api.patch('/donors/me/', { is_available: !profile.is_available })
      setProfile(res.data)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  if (error) return <Alert>{error}</Alert>
  if (!profile) return <Loading />

  // Things the donor should act on
  const needsAction = requests.filter(
    (r) => (r.initiated_by === 'hospital' && r.status === 'pending') || r.status === 'scheduled',
  )
  const upcoming = requests.filter((r) => r.status === 'confirmed')
  const daysLeft = daysUntil(profile.next_eligible_date)

  return (
    <>
      <PageHeader title={`Welcome, ${user.full_name.split(' ')[0]}`} />

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="md:col-span-2">
          <div className="flex flex-wrap items-center gap-6">
            <BloodGroup group={profile.blood_group} size="lg" />
            <div>
              {profile.is_eligible ? (
                <>
                  <p className="text-lg font-semibold">You can donate now</p>
                  <p className="text-sm text-muted">
                    {profile.last_donation_date
                      ? `Last donation: ${formatDate(profile.last_donation_date)}`
                      : 'No donations recorded yet.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold">Next eligible date: {formatDate(profile.next_eligible_date)}</p>
                  <p className="text-sm text-muted">
                    {daysLeft} day{daysLeft === 1 ? '' : 's'} to go. Donors wait 90 days between donations.
                  </p>
                </>
              )}
              <Link to="/donor/hospitals" className="mt-3 inline-block text-sm font-medium text-blood hover:underline">
                Find a hospital to donate at
              </Link>
            </div>
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-medium">Availability</p>
          <p className="mb-4 mt-1 text-sm text-muted">
            {profile.is_available
              ? 'Hospitals can send you requests when your blood group is needed.'
              : 'Hospitals will not send you requests until you are available again.'}
          </p>
          <Button variant={profile.is_available ? 'secondary' : 'primary'} onClick={toggleAvailability}>
            {profile.is_available ? 'Mark me unavailable' : 'Mark me available'}
          </Button>
        </Panel>
      </div>

      <Panel title="Needs your response" className="mt-6">
        {needsAction.length === 0 ? (
          <p className="text-sm text-muted">Nothing to respond to right now.</p>
        ) : (
          <ul className="divide-y divide-line">
            {needsAction.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {r.status === 'pending'
                      ? `${r.hospital.name} needs ${r.blood_group_needed} blood`
                      : `Confirm your appointment at ${r.hospital.name}`}
                  </p>
                  <p className="text-xs text-muted">
                    {r.status === 'pending'
                      ? `Needed by ${formatDate(r.required_date)}`
                      : `${formatDate(r.appointment?.scheduled_date)} at ${formatTime(r.appointment?.scheduled_time)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <UrgencyBadge level={r.urgency_level} label={r.urgency_label} />
                  <StatusBadge status={r.status} label={r.status_label} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {needsAction.length > 0 && (
          <Link to="/donor/requests" className="mt-3 inline-block text-sm font-medium text-blood hover:underline">
            Respond in My requests
          </Link>
        )}
      </Panel>

      {upcoming.length > 0 && (
        <Panel title="Upcoming appointments" className="mt-6">
          <ul className="divide-y divide-line">
            {upcoming.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <p className="font-medium">{r.hospital.name}, {r.hospital.address}</p>
                <p className="text-muted">
                  {formatDate(r.appointment.scheduled_date)} at {formatTime(r.appointment.scheduled_time)}
                  {r.appointment.instructions && ` - ${r.appointment.instructions}`}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  )
}
