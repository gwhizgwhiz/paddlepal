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

  // Shared init logic to fetch authUser and profile
  const init = async (authUser) => {
    setLoading(true)
    if (!authUser) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      // fetch profile from players or coaches
      let prof = null
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', authUser.id)
        .single()
      if (player) prof = player
      else {
        const { data: coach, error: coachErr } = await supabase
          .from('coaches')
          .select('*')
          .eq('user_id', authUser.id)
          .single()
        if (coach) prof = coach
      }

      // determine avatar
      const avatar_url =
        authUser.user_metadata?.avatar_url ||
        prof?.avatar_url ||
        DEFAULT_AVATARS[prof?.gender] ||
        DEFAULT_AVATARS.prefer_not_to_say

      setUser({ ...authUser, avatar_url })
      setProfile(prof)
    } catch (err) {
      console.error('UserContext init error:', err)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial load
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      init(session?.user)
    })

    // subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        init(session?.user)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
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
    await supabase.auth.updateUser({ data: { avatar_url: newUrl, gender: user.user_metadata?.gender } })

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
