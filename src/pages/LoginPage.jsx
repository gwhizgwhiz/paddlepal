// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../supabaseClient'
import '../App.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleLogin = async (e) => {
  e.preventDefault()
  console.log('🔑 handleLogin:start', { email, password: password && '••••••••' })
  setError(null)
  setLoading(true)

  try {
    const resp = await supabase.auth.signInWithPassword({ email, password })
    console.log('✅ handleLogin:response', resp)
  } catch (err) {
    console.error('❌ handleLogin:threw', err)
    setError(err.message || 'Unexpected error')
  } finally {
    console.log('⏹ handleLogin:finally — turning off loading')
    setLoading(false)
  }

  console.log('➡️ handleLogin:about to navigate')
  // try both:
  try {
    navigate('/dashboard')
    console.log('🚀 navigate called')
  } catch (navErr) {
    console.error('navigate threw', navErr)
    window.location.href = '/dashboard'
  }
}


  return (
    <div className="page-wrapper">
      <div className="signup-card">
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

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
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
    </div>
  )
}
