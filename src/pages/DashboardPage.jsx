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

  // Analysis state
  const [uploading, setUploading] = useState(false)
  const [analysisId, setAnalysisId] = useState(null)
  const [analysis, setAnalysis] = useState(null)

  // 1) Fetch profile info
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !authUser) return navigate('/signup')

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
      if (!playerData) return navigate('/complete-profile')

      let paddleData = null
      if (playerData.paddle_id) {
        const { data } = await supabase
          .from('paddle_options')
          .select('*')
          .eq('id', playerData.paddle_id)
          .single()
        paddleData = data
      }

      setUser(userData)
      setPlayer(playerData)
      setPaddle(paddleData)
      setLoading(false)
    }
    fetchData()
  }, [navigate])

  // 2) Poll analysis status whenever an analysisId appears
  useEffect(() => {
    if (!analysisId) return
    let timer
    const poll = async () => {
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single()
      setAnalysis(data)
      if (data.status === 'pending' || data.status === 'running') {
        timer = setTimeout(poll, 2000)
      }
    }
    poll()
    return () => clearTimeout(timer)
  }, [analysisId])

  const handleUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  setUploading(true)

  // --- 1) STORAGE UPLOAD ---
  // build a unique filename (no bucket prefix)
  const filename = `${Date.now()}_${file.name}`

  // attempt the upload
  const { data: upData, error: upErr } = await supabase
    .storage
    .from('match-videos')
    .upload(filename, file, { upsert: true })

  console.log('✅ Storage:', { upData, upErr })
  if (upErr) {
    // This is strictly a storage error
    console.error('Storage upload failed:', upErr)
    setUploading(false)
    return
  }

  // --- 2) RPC CALL ---
  // only if upload succeeded
  const { data: analysisId, error: rpcErr } = await supabase
    .rpc('start_analysis', { video_path: filename })

  console.log('✅ RPC:', { analysisId, rpcErr })
  if (rpcErr) {
    // This is strictly an RLS / RPC error
    console.error('start_analysis failed:', rpcErr)
    setUploading(false)
    return
  }

  // --- 3) Kick off polling of the newly created analysis ---
  setAnalysisId(analysisId)
  setUploading(false)
}

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
      {/* Profile */}
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

      {/* Upload & Analysis */}
      <div className="dashboard-section">
        <div className="section-header">Upload & AI Analysis</div>
        <div className="profile-card">
          {/* Upload control */}
          <label
            className="btn-small btn-outline"
            style={{ display: 'block', marginBottom: '1rem', textAlign: 'center' }}
          >
            {uploading ? 'Uploading…' : analysisId ? 'Re-upload Video' : 'Upload Match'}
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>

          {/* Status / Results */}
          {!analysisId && <p>Click to upload a match video.</p>}
          {analysisId && !analysis && <p>Queued for analysis…</p>}
          {analysis && analysis.status !== 'complete' && (
            <p>Analysis is {analysis.status}…</p>
          )}
          {analysis && analysis.status === 'complete' && (
            <>
              <h4>Results</h4>
              <pre style={{ maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(analysis.result_json, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
