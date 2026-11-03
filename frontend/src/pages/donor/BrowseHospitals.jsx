import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Alert, BloodGroup, Button, EmptyState, Field, Input, Loading, PageHeader, Textarea } from '../../components/ui'
import { COMPATIBLE_DONORS, errorMessage, formatDate, today } from '../../utils/format'

export default function BrowseHospitals() {
  const [hospitals, setHospitals] = useState(null)
  const [profile, setProfile] = useState(null)
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null) // hospital whose request form is open
  const [form, setForm] = useState({ required_date: '', reason: '' })
  const [message, setMessage] = useState({ kind: '', text: '' })

  function load(term = '') {
    api.get('/hospitals/', { params: term ? { search: term } : {} }).then((res) => setHospitals(res.data))
  }

  useEffect(() => {
    load()
    api.get('/donors/me/').then((res) => setProfile(res.data))
  }, [])

  async function submitRequest(hospital) {
    setMessage({ kind: '', text: '' })
    try {
      await api.post('/donations/requests/', { hospital_id: hospital.id, ...form })
      setMessage({ kind: 'success', text: `Request sent to ${hospital.name}. You will be notified when they respond.` })
      setOpenId(null)
      setForm({ required_date: '', reason: '' })
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) })
    }
  }

  // Can this donor's blood help a hospital that needs `group`?
  const canHelp = (group) => profile && COMPATIBLE_DONORS[group]?.includes(profile.blood_group)

  return (
    <>
      <PageHeader title="Find a hospital" description="Only hospitals verified by the admin are listed." />

      <form
        onSubmit={(e) => { e.preventDefault(); load(search) }}
        className="mb-6 flex gap-2"
      >
        <Input placeholder="Search by hospital name or city" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <Alert kind={message.kind}>{message.text}</Alert>

      {profile && !profile.is_eligible && (
        <Alert kind="info">You can send requests again from {formatDate(profile.next_eligible_date)}.</Alert>
      )}

      {!hospitals ? (
        <Loading />
      ) : hospitals.length === 0 ? (
        <EmptyState title="No verified hospitals found">Try a different name or city.</EmptyState>
      ) : (
        <div className="space-y-4">
          {hospitals.map((h) => (
            <article key={h.id} className="rounded-md border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{h.name}</h2>
                  <p className="text-sm text-muted">{h.address}, {h.city}</p>
                  <p className="mt-1 text-sm">Phone: {h.phone}</p>
                  <p className="text-sm">Email: {h.email}</p>
                  {h.blood_bank_details && <p className="mt-2 max-w-xl text-sm text-muted">{h.blood_bank_details}</p>}
                </div>
                {openId !== h.id && (
                  <Button onClick={() => setOpenId(h.id)} disabled={profile && !profile.is_eligible}>
                    Request to donate
                  </Button>
                )}
              </div>

              {h.blood_groups_needed.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium">Blood groups needed</p>
                  <div className="flex flex-wrap gap-2">
                    {h.blood_groups_needed.map((g) => <BloodGroup key={g} group={g} />)}
                  </div>
                  {h.blood_groups_needed.some(canHelp) && (
                    <p className="mt-2 text-sm text-green-800">Your blood group can help this hospital.</p>
                  )}
                </div>
              )}

              {openId === h.id && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <Field label="Preferred donation date (optional)">
                    <Input type="date" min={today()} value={form.required_date}
                      onChange={(e) => setForm({ ...form, required_date: e.target.value })} />
                  </Field>
                  <Field label="Note to the hospital (optional)">
                    <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                  </Field>
                  <div className="flex gap-2">
                    <Button onClick={() => submitRequest(h)}>Send request</Button>
                    <Button variant="secondary" onClick={() => setOpenId(null)}>Cancel</Button>
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
