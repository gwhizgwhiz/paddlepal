// LoginPage.jsx
// Fully styled and functional login screen for PaddlePal using Supabase

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../supabaseClient'
import '../App.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/dashboard') // already logged in
      }
    }
    checkSession()
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error.message)
      setError(error.message)
      setLoading(false)
    } else {
      console.log('Login success — rechecking session')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        navigate('/dashboard')
      } else {
        setError('Login succeeded, but session is not active.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="page-wrapper">
      <div className="signup-card">
        <h2>Log In</h2>
        <form onSubmit={handleLogin} className="page-form">
          <input
            type="email"
            className="input-dark"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-dark"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="form-footer">
          <p>Don’t have an account? <Link to="/signup">Sign up</Link></p>
          <p className="muted">Forgot password? (coming soon)</p>
        </div>
      </div>
    </div>
  )
}
