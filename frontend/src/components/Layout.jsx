/*
  The frame around every logged-in page: sidebar menu + main content area.
  The menu items depend on the user's role.
*/
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const MENUS = {
  donor: [
    ['/donor', 'Dashboard'],
    ['/donor/hospitals', 'Find a hospital'],
    ['/donor/requests', 'My requests'],
    ['/history', 'Donation history'],
    ['/donor/profile', 'My profile'],
  ],
  hospital_manager: [
    ['/hospital', 'Dashboard'],
    ['/hospital/requests', 'Donation requests'],
    ['/hospital/send', 'Request donors'],
    ['/history', 'Donation history'],
  ],
  admin: [
    ['/admin', 'Dashboard'],
    ['/admin/hospitals', 'Verify hospitals'],
    ['/admin/users', 'Users'],
    ['/admin/requests', 'All requests'],
  ],
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  // Refresh the unread notification count whenever the page changes
  useEffect(() => {
    api.get('/notifications/').then((res) => setUnread(res.data.unread)).catch(() => {})
  }, [location.pathname])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-blood-soft font-semibold text-blood-dark' : 'text-ink hover:bg-canvas'}`

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="inline-block h-4 w-4 rounded-sm bg-blood" aria-hidden="true" />
          <span className="font-semibold">Blood Donor Match</span>
        </div>
        <nav className="flex flex-wrap gap-1 px-3 pb-3 md:block md:space-y-1">
          {(MENUS[user.role] || []).map(([to, label]) => (
            <NavLink key={to} to={to} end className={linkClass}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/notifications" className={linkClass}>
            Notifications
            {unread > 0 && (
              <span className="ml-2 rounded bg-blood px-1.5 py-0.5 text-xs font-semibold text-white">{unread}</span>
            )}
          </NavLink>
        </nav>
        <div className="hidden border-t border-line px-5 py-4 md:block">
          <p className="truncate text-sm font-medium">{user.full_name}</p>
          <p className="text-xs text-muted">{user.role_label}</p>
          <button onClick={handleLogout} className="mt-3 text-sm font-medium text-blood hover:underline">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex justify-end md:hidden">
            <button onClick={handleLogout} className="text-sm font-medium text-blood">Log out</button>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
