import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'

export default function RequireProfile({ children }) {
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return navigate('/signup')

      const { data: profile } = await supabase
        .from('players')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return navigate('/profile/complete')
      setChecking(false)
    }
    check()
  }, [navigate])

  if (checking) return null
  return children
}
