// File: src/hooks/useCurrentUser.js
import { useState, useEffect } from 'react'
import supabase from '../supabaseClient'

/**
 * Hook to load the current authenticated user and their profile,
 * and subscribe to profile updates so avatar changes propagate.
 * Returns:
 *  - user: Supabase Auth user object or null
 *  - profile: row from `players` table matching user.id, or null
 *  - loading: boolean during initial fetch
 */
export default function useCurrentUser() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let profileSubscription = null

    const init = async () => {
      try {
        // Hydrate authenticated user
        const { data: { user: authUser }, error: authErr } =
          await supabase.auth.getUser()
        if (authErr) throw authErr
        if (!isMounted) return
        setUser(authUser)

        if (authUser) {
          // Fetch initial profile
          const { data: prof, error: profErr } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', authUser.id)
            .single()
          if (profErr) throw profErr
          if (isMounted) setProfile(prof)

          // Subscribe to realtime updates on this user's profile
          profileSubscription = supabase
            .from(`players:user_id=eq.${authUser.id}`)
            .on('UPDATE', payload => {
              if (isMounted) setProfile(payload.new)
            })
            .subscribe()
        }
      } catch (err) {
        console.error('useCurrentUser error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    init()

    return () => {
      isMounted = false
      if (profileSubscription) {
        supabase.removeSubscription(profileSubscription)
      }
    }
  }, [])

  return { user, profile, loading }
}
