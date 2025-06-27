// SignupPage.jsx
// Styled sign-up screen matching design spec for PaddlePal using Supabase auth

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import Card from '../components/Card'
import { Link } from 'react-router-dom'
import '../App.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('player')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}'/check-email`,
    }
  })

const user = data?.user
const session = data?.session

// Supabase did not throw error, but session is null AND user is already registered
const isAlreadyRegistered = !session && user && !user.confirmed_at

if (signUpError || isAlreadyRegistered) {
  setError('That email is already registered. Try logging in instead.')
  setLoading(false)
  return
}

    // Save minimal info for post-confirmation insert
    localStorage.setItem('signupRole', role)
    localStorage.setItem('signupFullName', fullName)


    navigate('/check-email')
  }

  return (
        <Card>
          <div className="profile-card">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup} className="page-form">
          <input
            className="input-dark"
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

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

          <select value={role} onChange={(e) => setRole(e.target.value)} className="input-dark">
            <option value="player">Player</option>
            {/* <option value="coach">Coach</option> */}
          </select>
{/* 
          <input
            className="input-dark"
            type="text"
            placeholder="Zip Code"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
          /> */}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing Up…' : 'Sign Up'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}

        <div className="form-footer">
          <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
        </div>
        </Card>
  )
}