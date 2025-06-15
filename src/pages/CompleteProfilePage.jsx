import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import AvatarUploader from '../components/AvatarUploader'
import LoadingSpinner from '../components/LoadingSpinner'
import maleAvatar from '../assets/avatars/male.png'
import femaleAvatar from '../assets/avatars/female.png'
import neutralAvatar from '../assets/avatars/neutral.png'
import CenteredPage from '../components/CenteredPage'
import '../App.css'

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [gender, setGender] = useState('')
  const [paddleOptions, setPaddleOptions] = useState([])
  const [modelOptions, setModelOptions] = useState([])
  const [formData, setFormData] = useState({
    rating_level: '',
    play_style: '',
    handedness: '',
    paddle_brand: '',
    paddle_model: '',
    play_format: '',
    favorite_player: '',
    preferred_surface: '',
    zipcode: localStorage.getItem('signupZipcode') || '',
    city: '',
    state: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      let retries = 0
      while (retries < 5) {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user?.id) {
          setUserId(user.id)
          await checkExistingPlayer(user.id)
          await loadUserData(user.id)
          await loadPaddles()
          setLoading(false)
          return
        }
        await new Promise(res => setTimeout(res, 500))
        retries++
      }
      navigate('/signup')
    }
    loadUser()
  }, [navigate])

  const checkExistingPlayer = async (uid) => {
    try {
      const { data: existingPlayer, error } = await supabase
        .from('players')
        .select('user_id')
        .eq('user_id', uid)
        .maybeSingle()
      if (existingPlayer) navigate('/dashboard')
      if (error) console.warn('RLS or query error on players:', error)
    } catch (err) {
      console.error('Error checking existing player:', err)
    }
  }

  const loadUserData = async (uid) => {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('gender, avatar_url')
      .eq('id', uid)
      .maybeSingle()
    if (error) console.warn('User row fetch error:', error)

    setGender(userRow?.gender || '')
    setAvatarUrl(userRow?.avatar_url || (
      userRow?.gender === 'female' ? femaleAvatar :
      userRow?.gender === 'male' ? maleAvatar : neutralAvatar
    ))
  }

  const loadPaddles = async () => {
    const { data: paddles, error } = await supabase.from('paddle_options').select('brand, model')
    if (error) console.warn('Error loading paddles:', error)
    setPaddleOptions(paddles || [])
  }

  useEffect(() => {
    const models = paddleOptions.filter(p => p.brand === formData.paddle_brand).map(p => p.model)
    setModelOptions(models)
  }, [formData.paddle_brand, paddleOptions])

  useEffect(() => {
    const fetchLocation = async () => {
      if (formData.zipcode.length === 5) {
        try {
          const res = await fetch(`https://api.zippopotam.us/us/${formData.zipcode}`)
          const json = await res.json()
          setFormData(prev => ({
            ...prev,
            city: json.places?.[0]?.['place name'] || '',
            state: json.places?.[0]?.['state abbreviation'] || ''
          }))
        } catch {
          console.warn('ZIP lookup failed')
        }
      }
    }
    fetchLocation()
  }, [formData.zipcode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'gender') {
      setGender(value)
      if (!avatarUrl || avatarUrl.includes('/avatars/')) {
        setAvatarUrl(
          value === 'female' ? femaleAvatar :
          value === 'male' ? maleAvatar : neutralAvatar
        )
      }
    }
  }

  const handleAvatarUpload = (url) => {
    if (url) {
      setAvatarUrl(url)
      supabase.from('users').update({ avatar_url: url }).eq('id', userId)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user }, error } = await supabase.auth.getUser()
if (!user) {
  console.error('User not found in session')
  setError('Session expired. Please log in again.')
  setLoading(false)
  return
}


    if (!userId) {
      setError('User ID not loaded.')
      setLoading(false)
      return
    }

    const { data: userRow, error: fetchUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (fetchUserError) console.error('User row check failed:', fetchUserError)

    if (!userRow) {
      const { error: insertUserErr } = await supabase.from('users').insert({
        id: userId,
        email: user.email,
        full_name: localStorage.getItem('signupFullName') || '',
        role: localStorage.getItem('signupRole') || 'player',
        gender: gender || null,
        avatar_url: avatarUrl || null,
        created_at: new Date().toISOString()
      })
      if (insertUserErr) {
        console.error('User insert failed:', insertUserErr)
        setError('Failed to insert user.')
        setLoading(false)
        return
      }
    }

    let paddleId = null
    let customPaddle = null
    if (formData.paddle_brand && formData.paddle_model) {
      const { data: paddleMatch } = await supabase
        .from('paddle_options')
        .select('id')
        .eq('brand', formData.paddle_brand)
        .eq('model', formData.paddle_model)
        .single()

      if (paddleMatch) paddleId = paddleMatch.id
      else customPaddle = `${formData.paddle_brand} ${formData.paddle_model}`
    }

    const { error: playerInsertError } = await supabase.from('players').insert({
      user_id: userId,
      rating_level: formData.rating_level,
      play_style: formData.play_style,
      handedness: formData.handedness,
      paddle_id: paddleId,
      custom_paddle: customPaddle,
      play_format: formData.play_format,
      favorite_player: formData.favorite_player,
      preferred_surface: formData.preferred_surface,
      zipcode: formData.zipcode,
      city: formData.city,
      state: formData.state
    })

    if (playerInsertError) {
      console.error('Player insert failed:', playerInsertError)
      setError(playerInsertError.message)
      setLoading(false)
      return
    }

    localStorage.removeItem('signupZipcode')
    localStorage.removeItem('signupFullName')
    localStorage.removeItem('signupRole')

    navigate('/dashboard')
  }

  if (loading) return <LoadingSpinner />

  return (
    <CenteredPage>
    <div className="page-wrapper">
      <div className="page-container">
        <h2>Complete Your Profile</h2>
        <form onSubmit={handleSubmit} className="page-form">
          <select name="gender" value={gender} onChange={handleChange} required>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="nonbinary">Non-Binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>

          <AvatarUploader userId={userId} avatarUrl={avatarUrl} onUpload={handleAvatarUpload} gender={gender} />

          <select name="rating_level" value={formData.rating_level} onChange={handleChange} required>
            <option value="">Rating Level</option>
            {['pro', '5.5', '5.0', '4.5', '4.0', '3.5', '3.0', '2.5', '2.0'].map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select name="play_style" value={formData.play_style} onChange={handleChange} required>
            <option value="">Play Style</option>
            <option value="aggressive">Aggressive</option>
            <option value="defensive">Defensive</option>
            <option value="all-court">All-Court</option>
          </select>

          <select name="handedness" value={formData.handedness} onChange={handleChange} required>
            <option value="">Handedness</option>
            <option value="right">Right</option>
            <option value="left">Left</option>
            <option value="ambidextrous">Ambidextrous</option>
          </select>

          <div className="form-row">
            <select name="paddle_brand" value={formData.paddle_brand} onChange={handleChange} className="form-control">
              <option value="">Select Brand</option>
              {[...new Set(paddleOptions.map(p => p.brand))].map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <select name="paddle_model" value={formData.paddle_model} onChange={handleChange} className="form-control">
              <option value="">Select Model</option>
              {modelOptions.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <select name="play_format" value={formData.play_format} onChange={handleChange} required>
            <option value="">Singles / Doubles</option>
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
            <option value="both">Both</option>
          </select>

          <input type="text" name="favorite_player" placeholder="Favorite Player" value={formData.favorite_player} onChange={handleChange} />

          <select name="preferred_surface" value={formData.preferred_surface} onChange={handleChange} required>
            <option value="">Preferred Surface</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="either">Either</option>
          </select>

          <input type="text" name="zipcode" placeholder="Zip Code" value={formData.zipcode} onChange={handleChange} />
          <input type="text" name="city" placeholder="City" value={formData.city} disabled />
          <input type="text" name="state" placeholder="State" value={formData.state} disabled />

          <button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Finish'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
    </CenteredPage>
  )
}
