// AvatarMenu.jsx
// Shows user's avatar and dropdown menu with Profile, Settings, Logout

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import '../App.css'

export default function AvatarMenu() {
  const [open, setOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const dropdownRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAvatar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        setAvatarUrl(profile?.avatar_url || '/default-avatar.png')
      }
    }
    fetchAvatar()
  }, [])

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
    navigate('/')
  }

  return (
    <div className="avatar-menu" ref={dropdownRef}>
      <img
        src={avatarUrl}
        alt="avatar"
        className="avatar-icon"
        onClick={() => setOpen(prev => !prev)}
      />
      {open && (
        <div className="dropdown-menu">
          <button onClick={() => navigate('/profile/edit')}>Profile</button>
          <button onClick={() => navigate('/settings')}>Settings</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}
    </div>
  )
}
