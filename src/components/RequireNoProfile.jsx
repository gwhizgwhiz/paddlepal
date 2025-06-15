import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import LoadingSpinner from './LoadingSpinner'

export default function RequireNoProfile({ children }) {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
  const verify = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.warn('No user, redirecting.')
      navigate('/signup')
      return
    }

    try {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (player?.user_id) {
        console.log('Player profile exists → /dashboard')
        navigate('/dashboard')
      } else {
        console.log('No player profile found.')
        setChecking(false)
      }

      if (playerError) {
        console.warn('playerError:', playerError)
      }
    } catch (err) {
      console.error('Supabase fetch error:', err)
      setChecking(false)
    }
  }

  verify()
}, [navigate])


  if (checking) return <LoadingSpinner />
  return children
}
