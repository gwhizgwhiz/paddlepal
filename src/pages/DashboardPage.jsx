// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import LoadingSpinner from '../components/LoadingSpinner'
import maleAvatar from '../assets/avatars/male.png'
import femaleAvatar from '../assets/avatars/female.png'
import neutralAvatar from '../assets/avatars/neutral.png'
import '../App.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [paddle, setPaddle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        navigate('/signup')
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      if (userError) console.warn('User fetch error:', userError.message)

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', authUser.id)
        .single()
      if (playerError) console.warn('Player fetch error:', playerError.message)

      let paddleData = null
      if (playerData?.paddle_id) {
        const { data, error } = await supabase
          .from('paddle_options')
          .select('*')
          .eq('id', playerData.paddle_id)
          .single()
        if (error) console.warn('Paddle fetch error:', error.message)
        else paddleData = data
      }

      setUser(userData)
      setPlayer(playerData)
      setPaddle(paddleData)
      setLoading(false)
    }

    fetchData()
  }, [navigate])

  if (loading) return <LoadingSpinner />

  const avatarUrl =
    player.avatar_url ||
    (player.gender === 'female'
      ? femaleAvatar
      : player.gender === 'male'
      ? maleAvatar
      : neutralAvatar)

  return (
    <div className="page-container">
      {/* My Profile */}
      <div className="dashboard-section">
        <div className="section-header">My Profile</div>
        <div className="profile-card">
          <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
          <div className="profile-details">
            <strong>{user.full_name}</strong><br />
            {player.city}, {player.state}<br />
            <small>{user.role}</small>
            <p>
              Rating: <strong>{player.rating_level}</strong><br />
              Play Style: <strong>{player.play_style}</strong><br />
              Handedness: <strong>{player.handedness}</strong><br />
              Preferred Surface:{' '}
              <strong>{player.preferred_surface}</strong><br />
              Paddle:{' '}
              <strong>
                {paddle
                  ? `${paddle.brand} ${paddle.model}`
                  : player.custom_paddle || 'Not specified'}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Upload Match Video */}
      <div className="dashboard-section">
        <div className="section-header">Upload Match Video</div>
        <div className="profile-card">
          <div className="upload-widget">
            {/* swap in your real upload component here */}
            <p>Coming soon…</p>
            <button className="btn-small btn-outline">
              Upload Video
            </button>
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="dashboard-section">
        <div className="section-header">Recent Analysis</div>
        <div className="profile-card">
          <div className="recent-analyses-list">
            {/* map your analysis items here */}
            <p>Coming soon…</p>
          </div>
        </div>
      </div>

      {/* Recommended Drills */}
      <div className="dashboard-section">
        <div className="section-header">Recommended Drills</div>
        <div className="profile-card">
          <div className="drill-suggestions">
            {/* render your drill suggestions here */}
            <p>Coming soon…</p>
          </div>
        </div>
      </div>
    </div>
  )
}
