// Header.jsx
// PaddlePal app header with smart nav behavior based on login state

import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import supabase from '../supabaseClient'
import defaultAvatar from '../assets/avatars/neutral.png'
import '../App.css'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatar)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()

  const user = session?.user
  const isConfirmed = !!user?.confirmed_at

  if (!user || !isConfirmed) {
    setIsLoggedIn(false)
    return
  }

  setIsLoggedIn(true)

  const { data } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  if (data?.avatar_url) {
    setAvatarUrl(data.avatar_url)
  }
}


    const { data: listener } = supabase.auth.onAuthStateChange(() => fetchProfile())
    fetchProfile()
    return () => listener?.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    navigate('/')
  }
useEffect(() => {
  const debugAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('[Supabase Session]', session)
    console.log('[Supabase User]', session?.user)
  }
  debugAuth()
}, [])
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-area" onClick={() => navigate('/')}>
            <span className="logo-emoji" role="img" aria-label="paddle">🏓</span>
            <span className="site-name">PaddlePal</span>
        </div>

        {!isLoggedIn ? (
            <nav className="nav-links">
                <Link className="nav-link" to="/login">Log In</Link>
                <Link className="nav-link" to="/signup">Sign Up</Link>
            </nav>
            ) : (
            <div className="avatar-menu-wrapper">
        <img
        src={avatarUrl || '/default-avatar.png'}
        alt="User Avatar"
        className="avatar-thumb"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        />
        {dropdownOpen && (
        <div className="dropdown-menu">
            <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
            <Link to="/profile/edit" className="dropdown-item">Profile</Link>
            <Link to="/settings" className="dropdown-item">Settings</Link>
            <button onClick={handleLogout} className="dropdown-item logout">Log Out</button>
        </div>
        )}
    </div>
    )}
      </div>
    </header>
  )
}
