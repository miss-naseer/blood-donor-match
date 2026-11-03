import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Alert, Loading, PageHeader, Select } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { errorMessage, formatDate } from '../../utils/format'

export default function ManageUsers() {
  const { user: me } = useAuth()
  const [role, setRole] = useState('')
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')

  function load(r = role) {
    api.get('/auth/users/', { params: r ? { role: r } : {} }).then((res) => setUsers(res.data))
  }
  useEffect(() => load(role), [role]) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(u) {
    setError('')
    try {
      await api.post(`/auth/users/${u.id}/toggle-active/`)
      load()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Deactivated users cannot log in or receive requests."
        action={
          <div className="w-52">
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              <option value="donor">Donors</option>
              <option value="hospital_manager">Hospital managers</option>
              <option value="admin">Admins</option>
            </Select>
          </div>
        }
      />
      <Alert>{error}</Alert>
      {!users ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto rounded-md border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role_label}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(u.date_joined)}</td>
                  <td className="px-4 py-3">{u.is_active ? 'Active' : <span className="text-blood">Deactivated</span>}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== me.id && (
                      <button onClick={() => toggle(u)} className="font-medium text-blood hover:underline">
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
