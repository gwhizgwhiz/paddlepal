// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import maleAvatar from '../assets/avatars/male.png'
import femaleAvatar from '../assets/avatars/female.png'
import neutralAvatar from '../assets/avatars/neutral.png'
import '../App.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(true)
  const [user, setUser]         = useState(null)
  const [player, setPlayer]     = useState(null)
  const [paddle, setPaddle]     = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user: auth } } = await supabase.auth.getUser()
      if (!auth) return navigate('/login')
      const [{ data: u }, { data: pl }] = await Promise.all([
        supabase.from('users').select('*').eq('id', auth.id).single(),
        supabase.from('players').select('*').eq('user_id', auth.id).single()
      ])
      if (!pl) return navigate('/complete-profile')
      let paddleData = null
      if (pl.paddle_id) {
        const { data } = await supabase
          .from('paddle_options')
          .select('*')
          .eq('id', pl.paddle_id)
          .single()
        paddleData = data
      }
      setUser(u)
      setPlayer(pl)
      setPaddle(paddleData)
      setLoading(false)
    }
    load()
  }, [navigate])

  if (loading) return <LoadingSpinner />

  const avatarUrl =
    user.avatar_url ||
    (player.gender === 'female'
      ? femaleAvatar
      : player.gender === 'male'
      ? maleAvatar
      : neutralAvatar)

  return (
    <div className="page-wrapper">
      <Card>
        <div className="profile-page">
          <img src={avatarUrl} className="profile-avatar-large" alt="avatar" />
          <h2>{user.full_name}</h2>
          <p>{player.city}, {player.state}</p>
          <p><em>{user.role}</em></p>
          <hr/>
          <div className="profile-field">
            <div className="profile-label">Rating</div>
            <div className="profile-value">{player.rating_level}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Play Style</div>
            <div className="profile-value">{player.play_style}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Handedness</div>
            <div className="profile-value">{player.handedness}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Surface</div>
            <div className="profile-value">{player.preferred_surface}</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Paddle</div>
            <div className="profile-value">
              {paddle
                ? `${paddle.brand} ${paddle.model}`
                : player.custom_paddle || 'Not specified'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
