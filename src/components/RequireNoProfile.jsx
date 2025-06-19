// File: src/components/RequireNoProfile.jsx
import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

/**
 * If not signed in ⇒ send to signup.
 * If already has a profile ⇒ send to dashboard.
 * Otherwise render children (e.g. CompleteProfilePage).
 */
export default function RequireNoProfile({ children }) {
  const { user, profile } = useUser()

  if (!user) {
    return <Navigate to="/signup" replace />
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
