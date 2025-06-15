// src/components/RequireAuth.jsx
import { Navigate } from 'react-router-dom'
import useCurrentUser from '../hooks/useCurrentUser'

export default function RequireAuth({ children }) {
  const { user, loading } = useCurrentUser()

  if (loading) {
    return <div className="loading">Authenticating...</div>
  }

  if (!user) {
    // not signed in ⇒ send to signup or login
    return <Navigate to="/signup" replace />
  }

  // signed in ⇒ render protected content
  return children
}
