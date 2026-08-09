import { Navigate, useLocation } from 'react-router-dom'
import { canAccessPath, getRole } from '../auth'

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation()
  const role = getRole()

  if (!role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!canAccessPath(role, location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
