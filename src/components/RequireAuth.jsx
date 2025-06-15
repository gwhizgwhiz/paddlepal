// File: src/components/RequireAuth.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'

export default function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setAuthenticated(true)
      } else {
        navigate('/signup')
      }

      setLoading(false)
    }

    checkSession()
  }, [navigate])

  if (loading) return <div className="loading">Authenticating...</div>

  return authenticated ? children : null
}
