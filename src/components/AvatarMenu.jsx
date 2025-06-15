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

  // Determine which avatar to show
  let avatarSrc
  if (profile?.avatar_url) {
    // Use uploaded avatar via Supabase Storage public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url)
    avatarSrc = publicUrl || neutralAvatar
  } else {
    // No upload → choose default by gender_identity
    switch (profile?.gender_identity) {
      case 'male':
        avatarSrc = maleAvatar
        break
      case 'female':
        avatarSrc = femaleAvatar
        break
      default:
        avatarSrc = neutralAvatar
    }
  }

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
