import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import AvatarMenu from './AvatarMenu'
import '../App.css'

export default function Header() {
  const navigate = useNavigate()
  const { user } = useUser()

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-area" onClick={() => navigate('/')}>
          🏓 <span className="site-name">PaddlePal</span>
        </div>
        {user ? (
          <AvatarMenu />
        ) : (
          <nav className="nav-links">
            <Link to="/login">Log In</Link>
            <Link to="/signup">Sign Up</Link>
          </nav>
        )}
      </div>
    </header>
  )
}
