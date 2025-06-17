// File: src/hooks/useCurrentUser.js
import { useState, useEffect, useCallback } from 'react'
import supabase from '../supabaseClient'

export default function useCurrentUser() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session fetch error:', sessionError)
        setUser(null)
        setProfile(null)
        return
      }

      const authUser = session?.user ?? null
      setUser(authUser)

      if (authUser) {
        // Try players table first
        let { data: prof, error: profErr } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        if (profErr || !prof) {
          // Then try coaches
          const { data: coach, error: coachErr } = await supabase
            .from('coaches')
            .select('*')
            .eq('user_id', authUser.id)
            .single()

          if (coachErr || !coach) {
            console.error('Profile not found in players or coaches')
            setProfile(null)
          } else {
            setProfile(coach)
          }
        } else {
          setProfile(prof)
        }
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.error('useCurrentUser unexpected error:', err)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProfile()
    window.addEventListener('profile-updated', refreshProfile)
    return () => window.removeEventListener('profile-updated', refreshProfile)
  }, [refreshProfile])

  return { user, profile, loading }
}
