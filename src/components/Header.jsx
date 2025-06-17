// File: src/components/Header.jsx
import { Link, useNavigate } from 'react-router-dom'
import useCurrentUser from '../hooks/useCurrentUser'
import AvatarMenu from './AvatarMenu'
import '../App.css'

/**
 * PaddlePal app header with user-aware navigation and avatar menu
 */
export default function Header() {
  const navigate = useNavigate()
  const { user, loading } = useCurrentUser()

  // While loading auth state
  if (loading) {
    return (
      <header className="app-header">
        <div className="header-content">Loading...</div>
      </header>
    )
  }

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo area */}
        <div className="logo-area" onClick={() => navigate('/')}>  
          <span className="logo-emoji" role="img" aria-label="paddle">🏓</span>
          <span className="site-name">PaddlePal</span>
        </div>

        {/* Navigation */}
        {user ? (
          // Logged in: show avatar menu
          <AvatarMenu />
        ) : (
          // Not logged in: show links
          <nav className="nav-links">
            <Link className="nav-link" to="/login">Log In</Link>
            <Link className="nav-link" to="/signup">Sign Up</Link>
          </nav>
        )}
      </div>
    </header>
  )
}
