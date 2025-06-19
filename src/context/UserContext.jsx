// File: src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import supabase from '../supabaseClient'

// Default avatars by gender
export const DEFAULT_AVATARS = {
  male: '/src/assets/avatars/male.png',
  female: '/src/assets/avatars/female.png',
  nonbinary: '/src/assets/avatars/neutral.png',
  prefer_not_to_say: '/src/assets/avatars/default-avatar.png',
}

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)       // Supabase auth user + avatar_url
  const [profile, setProfile] = useState(null) // Your players/coaches row
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      setLoading(true)
      try {
        // 1) Read auth user from localStorage
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!mounted) return
        if (!authUser) {
          setUser(null)
          setProfile(null)
          return
        }

        // 2) Try players table
        let prof = null
        const { data: player, error: playerErr } = await supabase
          .from('players')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        if (player) {
          prof = player
        } else {
          // 3) Fallback to coaches
          const { data: coach, error: coachErr } = await supabase
            .from('coaches')
            .select('*')
            .eq('user_id', authUser.id)
            .single()

          if (coach) {
            prof = coach
          } else {
            console.warn('No profile found:', playerErr || coachErr)
          }
        }

        // 4) Determine avatar: metadata → DB → default
        const avatar_url =
          authUser.user_metadata?.avatar_url ||
          prof?.avatar_url ||
          DEFAULT_AVATARS[prof?.gender] ||
          DEFAULT_AVATARS.prefer_not_to_say

        // 5) Set context state
        setUser({ ...authUser, avatar_url })
        setProfile(prof || null)
      } catch (err) {
        console.error('UserContext init error:', err)
        setUser(null)
        setProfile(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  // Helper to update avatar in both tables and metadata
  const updateAvatar = async (newUrl) => {
    if (!user) return

    // decide table
    const { data: exists } = await supabase
      .from('players')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    const table = exists ? 'players' : 'coaches'

    // 1) update profiles table
    await supabase
      .from(table)
      .update({ avatar_url: newUrl })
      .eq('user_id', user.id)

    // 2) update auth metadata
    await supabase.auth.updateUser({
      data: { avatar_url: newUrl, gender: user.user_metadata?.gender },
    })

    // 3) update in-memory
    setUser((u) => (u ? { ...u, avatar_url: newUrl } : u))
    setProfile((p) => (p ? { ...p, avatar_url: newUrl } : p))
  }

  return (
    <UserContext.Provider value={{ user, profile, loading, updateAvatar }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
