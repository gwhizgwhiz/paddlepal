import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import supabase from '../supabaseClient'
import '../App.css'

export default function AvatarMenu() {
  const navigate = useNavigate()
  const { user, updateAvatar } = useUser()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const onClick = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) return null

  return (
    <div className="avatar-menu" ref={ref}>
      <img
        src={user.avatar_url}
        alt="avatar"
        className="avatar-icon"
        width={40}
        height={40}
        onClick={() => setOpen(o => !o)}
      />
      {open && (
        <div className="dropdown-menu">
          <button onClick={() => navigate('/profile/edit')}>Profile</button>
          <button onClick={() => navigate('/settings')}>Settings</button>
          <button onClick={async () => {
            await supabase.auth.signOut()
            navigate('/login', { replace: true })
          }}>
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
