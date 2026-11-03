import { Navigate } from 'react-router-dom'
import { homePath, useAuth } from '../context/AuthContext'

/*
  Wrap a page with this to make it login-only.
  `roles` limits who can open it, e.g. roles={['donor']}.
*/
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace />
  return children
}
