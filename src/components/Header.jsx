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
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Header: session error', error)
          setIsLoggedIn(false)
          setAvatarUrl(defaultAvatar)
          return
        }
        const user = session?.user
        const isConfirmed = !!user?.confirmed_at

        if (!user || !isConfirmed) {
          setIsLoggedIn(false)
          setAvatarUrl(defaultAvatar)
          return
        }

        setIsLoggedIn(true)

        const { data, error: userErr } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single()

        if (userErr) {
          console.warn('Header: user avatar fetch error', userErr)
        }

        setAvatarUrl(data?.avatar_url || defaultAvatar)
      } catch (err) {
        setIsLoggedIn(false)
        setAvatarUrl(defaultAvatar)
        console.error('Header: fetchProfile exception', err)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(() => fetchProfile())
    fetchProfile()
    return () => listener?.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setAvatarUrl(defaultAvatar)
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
              src={avatarUrl || defaultAvatar}
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