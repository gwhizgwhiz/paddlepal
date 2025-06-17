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
      const {
        data: { user: authUser },
        error: authError
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        navigate('/signup')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      let paddleData = null
      if (playerData?.paddle_id && typeof playerData.paddle_id === 'string' && playerData.paddle_id.length === 36) {
        const { data, error } = await supabase
        .from('paddle_options')
        .select('*')
        .eq('id', playerData.paddle_id)
        .single()

  if (error) console.warn('Paddle fetch error:', error.message)
  paddleData = data
}


      setUser(userData)
      setPlayer(playerData)
      setPaddle(paddleData)
      setLoading(false)
    }

    fetchData()
  }, [navigate])

  if (loading) return <LoadingSpinner />;


  const avatarUrl = player.avatar_url || (
  player.gender === 'female' ? femaleAvatar :
  player.gender === 'male' ? maleAvatar :
  neutralAvatar
);


  return (
    <div className="page-container">
      <div className="dashboard-section">
        <div className="section-header">My Profile</div>
        <div className="profile-card">
          <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
          <div className="profile-details">
            <strong>{user.full_name}</strong><br />
            {player.city}, {player.state}<br />
            <small>{user.role}</small><br />
            <p>
              <strong>Rating:</strong> {player.rating_level}<br />
              <strong>Play Style:</strong> {player.play_style}<br />
              <strong>Handedness:</strong> {player.handedness}<br />
              <strong>Preferred Surface:</strong> {player.preferred_surface}<br />
              <strong>Paddle:</strong>{' '}
              {paddle
                ? `${paddle.brand} ${paddle.model}`
                : player.custom_paddle || 'Not specified'}
            </p>
            <button className="btn-small btn-outline" onClick={() => navigate('/profile/edit')}>
              Edit My Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 