// File: src/components/RequireProfile.jsx
import { Navigate } from 'react-router-dom'
import useCurrentUser from '../hooks/useCurrentUser'
import LoadingSpinner from './LoadingSpinner'

/**
 * Ensures the authenticated user has a completed profile.
 * - Redirects to /signup if not signed in
 * - Redirects to /profile/complete if signed in but profile missing
 * - Shows spinner while loading
 * - Renders children when profile exists
 */
export default function RequireProfile({ children }) {
  const { user, profile, loading } = useCurrentUser()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/signup" replace />
  }

  if (!profile) {
    return <Navigate to="/profile/complete" replace />
  }

  return children
}
