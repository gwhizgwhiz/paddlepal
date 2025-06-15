// File: src/components/RequireNoProfile.jsx
import { Navigate } from 'react-router-dom'
import useCurrentUser from '../hooks/useCurrentUser'
import LoadingSpinner from './LoadingSpinner'

/**
 * Redirects authenticated users who already have a profile out to /dashboard.
 * If no user, sends to /signup.
 * Otherwise renders children.
 */
export default function RequireNoProfile({ children }) {
  const { user, profile, loading } = useCurrentUser()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/signup" replace />
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
