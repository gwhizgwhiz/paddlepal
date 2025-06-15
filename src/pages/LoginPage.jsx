import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../supabaseClient'
import '../App.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  console.log('[Login] Attempting login...')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  console.log('[Login] Response:', { data, error })

  if (error) {
    console.error('[Login] Error:', error.message)
    setError(error.message)
    setLoading(false)
    return
  }

  // Manual session check
  let session = data?.session
  if (!session) {
    await new Promise(res => setTimeout(res, 250)) // optional buffer
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData?.session) {
      console.warn('[Login] No session after fallback', sessionError)
      setError('Login failed. Please try again.')
      setLoading(false)
      return
    }
    session = sessionData.session
  }

  console.log('[Login] Login successful. Navigating to dashboard.')
  navigate('/dashboard')
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
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input-dark"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn-primary" type="submit" disabled={loading}>
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
