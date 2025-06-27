// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../supabaseClient'
import Card from '../components/Card'
import '../App.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
    } else {
      // On success, just navigate—your UserProvider will pick up the new session
      navigate('/dashboard', { replace: true })
    }
  }

  return (
        <Card>
          <div className="profile-card">
        <h2>Log In</h2>
        <form onSubmit={handleLogin} className="page-form">
          <input
            className="input-dark"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            className="input-dark"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="form-footer">
          <p>
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
          <p className="muted">Forgot password? (coming soon)</p>
        </div>
        </div>
        </Card>
  )
}
