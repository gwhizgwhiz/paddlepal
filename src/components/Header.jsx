// File: src/components/Header.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import useCurrentUser from '../hooks/useCurrentUser'
import defaultAvatar from '../assets/avatars/neutral.png'
import '../App.css'

/**
 * PaddlePal app header with smart nav based on auth state
 */
export default function Header() {
  const navigate = useNavigate()
  const { user, profile, loading } = useCurrentUser()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  if (loading) {
    return (
      <header className="app-header">
        <div className="header-content">Loading...</div>
      </header>
    )
  }

  const isLoggedIn = Boolean(user)
  const avatarUrl = profile?.avatar_url || defaultAvatar

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

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
              src={avatarUrl}
              alt="User Avatar"
              className="avatar-thumb"
              onClick={() => setDropdownOpen(prev => !prev)}
            />
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
                <Link to="/profile/edit" className="dropdown-item">Profile</Link>
                <Link to="/settings" className="dropdown-item">Settings</Link>
                <button onClick={handleLogout} className="dropdown-item logout">
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
