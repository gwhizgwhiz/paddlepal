// File: src/components/RequireAuth.jsx
import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function RequireAuth({ children }) {
  const { user } = useUser()

  // If there’s no user in context, redirect to login/signup
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Otherwise, render the protected content
  return <>{children}</>
}
