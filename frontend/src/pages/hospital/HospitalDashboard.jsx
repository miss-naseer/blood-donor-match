import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { Alert, Loading, PageHeader, Panel, Stat, StatusBadge } from '../../components/ui'
import { errorMessage } from '../../utils/format'
import HospitalForm from './HospitalForm'

export default function HospitalDashboard() {
  const [hospital, setHospital] = useState(undefined) // undefined = loading, null = not registered
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState({ kind: '', text: '' })

  useEffect(() => {
    api.get('/hospitals/mine/')
      .then((res) => setHospital(res.data))
      .catch((err) => (err.response?.status === 404 ? setHospital(null) : setMessage({ kind: 'error', text: errorMessage(err) })))
    api.get('/donations/requests/hospital/').then((res) => setRequests(res.data))
  }, [])

  async function registerHospital(data) {
    try {
      const res = await api.post('/hospitals/register/', data)
      setHospital(res.data)
      setMessage({ kind: 'success', text: 'Hospital registered. The admin will review it shortly.' })
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) })
    }
  }

  async function updateHospital(data) {
    try {
      const res = await api.patch('/hospitals/mine/', data)
      setHospital(res.data)
      setMessage({ kind: 'success', text: 'Hospital details saved.' })
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) })
    }
  }

  if (hospital === undefined && !message.text) return <Loading />

  // Step 1: no hospital yet -> show the registration form
  if (hospital === null) {
    return (
      <>
        <PageHeader title="Register your hospital" description="Donors can see your hospital after the admin verifies it." />
        <Alert kind={message.kind}>{message.text}</Alert>
        <Panel><HospitalForm submitLabel="Register hospital" onSubmit={registerHospital} /></Panel>
      </>
    )
  }
  if (!hospital) return <Alert>{message.text}</Alert>

  const count = (check) => requests.filter(check).length

  return (
    <>
      <PageHeader title={hospital.name} description={`${hospital.address}, ${hospital.city}`} action={<StatusBadge status={hospital.verification_status} label={hospital.status_label} />} />
      <Alert kind={message.kind}>{message.text}</Alert>

      {hospital.verification_status === 'pending' && (
        <Alert kind="info">Your hospital is waiting for verification by the admin. You can manage requests once it is verified.</Alert>
      )}
      {hospital.verification_status === 'rejected' && (
        <Alert>Your hospital was not verified. Reason: {hospital.rejection_reason}. Update your details below to send it for review again.</Alert>
      )}

      {hospital.verification_status === 'verified' && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Link to="/hospital/requests"><Stat label="Donor requests to review" value={count((r) => r.status === 'pending' && r.initiated_by === 'donor')} /></Link>
          <Link to="/hospital/requests"><Stat label="Waiting to be scheduled" value={count((r) => ['approved', 'reschedule_requested'].includes(r.status))} /></Link>
          <Link to="/hospital/requests"><Stat label="Confirmed appointments" value={count((r) => r.status === 'confirmed')} /></Link>
        </div>
      )}

      <Panel title="Hospital details">
        <HospitalForm initial={hospital} submitLabel="Save details" onSubmit={updateHospital} />
      </Panel>
    </>
  )
}
