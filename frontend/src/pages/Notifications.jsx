import { useEffect, useState } from 'react'
import api from '../api/client'
import { Button, EmptyState, Loading, PageHeader } from '../components/ui'
import { formatDate } from '../utils/format'

export default function Notifications() {
  const [items, setItems] = useState(null)

  function load() {
    api.get('/notifications/').then((res) => setItems(res.data.results))
  }
  useEffect(load, [])

  async function markRead(id) {
    await api.post(`/notifications/${id}/read/`)
    load()
  }

  async function markAllRead() {
    await api.post('/notifications/read-all/')
    load()
  }

  if (!items) return <Loading />

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your hospital, requests and appointments."
        action={items.some((n) => !n.is_read) && <Button variant="secondary" onClick={markAllRead}>Mark all as read</Button>}
      />
      {items.length === 0 ? (
        <EmptyState title="No notifications yet">You will be notified when something changes.</EmptyState>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line bg-white">
          {items.map((n) => (
            <li key={n.id} className={`flex items-start justify-between gap-4 px-5 py-4 ${n.is_read ? '' : 'border-l-4 border-l-blood'}`}>
              <div>
                <p className={`text-sm ${n.is_read ? 'text-muted' : 'font-medium'}`}>{n.message}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => markRead(n.id)} className="shrink-0 text-sm text-blood hover:underline">
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
