// File: src/components/AvatarMenu.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import useCurrentUser from '../hooks/useCurrentUser'
import neutralAvatar from '../assets/avatars/neutral.png'
import maleAvatar    from '../assets/avatars/male.png'
import femaleAvatar  from '../assets/avatars/female.png'
import '../App.css'

export default function AvatarMenu() {
  const { user, profile, loading } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const dropdownRef     = useRef()
  const navigate        = useNavigate()

  // Add at top
const [avatarSrc, setAvatarSrc] = useState(neutralAvatar)

useEffect(() => {
  const resolveAvatar = async () => {
    if (profile?.avatar_url) {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(profile.avatar_url)
      if (data?.publicUrl) {
        setAvatarSrc(data.publicUrl)
        return
      }
    }

    // Fallback based on gender
    switch (profile?.gender) {
      case 'female':
        setAvatarSrc(femaleAvatar)
        break
      case 'male':
        setAvatarSrc(maleAvatar)
        break
      default:
        setAvatarSrc(neutralAvatar)
    }
  }

  resolveAvatar()
}, [profile?.avatar_url, profile?.gender])


  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  if (loading || !user) return null

  return (
    <div className="avatar-menu" ref={dropdownRef}>
      <img
        src={avatarSrc}
        alt="User avatar"
        className="avatar-icon"
        onClick={() => setOpen(prev => !prev)}
      />

      {open && (
        <div className="dropdown-menu">
          <button onClick={() => navigate('/profile/edit')}>
            Profile
          </button>
          <button onClick={() => navigate('/settings')}>
            Settings
          </button>
          <button onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
