// File: src/pages/ProfileEditPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'
import AvatarUploader from '../components/AvatarUploader'
import LoadingSpinner from '../components/LoadingSpinner'
import { useUser, DEFAULT_AVATARS } from '../context/UserContext'
import '../App.css'

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const { user, updateAvatar } = useUser()
  const [gender, setGender] = useState('')
  const [formData, setFormData] = useState({
    rating_level: '',
    play_style: '',
    handedness: '',
    paddle_brand: '',
    paddle_model: '',
    play_format: '',
    favorite_player: '',
    preferred_surface: '',
    zipcode: '',
    city: '',
    state: ''
  })
  const [paddleOptions, setPaddleOptions] = useState([])
  const [modelOptions, setModelOptions]     = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  // Block until user is loaded
  if (!user) return <LoadingSpinner />

  // Load paddles & existing profile
  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser }, error } = await supabase.auth.getUser()
      if (error || !authUser) return navigate('/signup')

      // paddles
      const { data: allPaddles } = await supabase
        .from('paddle_options')
        .select('brand, model')
      setPaddleOptions(allPaddles || [])

      // profile
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', authUser.id)
        .single()
      if (player) {
        setFormData(prev => ({ ...prev, ...player }))
        setGender(player.gender || '')
      }
    }
    init()
  }, [navigate])

  // update modelOptions when brand changes
  useEffect(() => {
    const models = paddleOptions
      .filter(p => p.brand === formData.paddle_brand)
      .map(p => p.model)
    setModelOptions(models)
  }, [formData.paddle_brand, paddleOptions])

  // ZIP → city/state lookup
  useEffect(() => {
    if (formData.zipcode.length === 5) {
      fetch(`https://api.zippopotam.us/us/${formData.zipcode}`)
        .then(r => r.json())
        .then(json => {
          setFormData(prev => ({
            ...prev,
            city: json.places?.[0]?.['place name'] || '',
            state: json.places?.[0]?.['state abbreviation'] || ''
          }))
        })
        .catch(() => console.warn('ZIP lookup failed'))
    }
  }, [formData.zipcode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'gender') {
      setGender(value)
      // instantly apply default avatar for this gender
      const defUrl = DEFAULT_AVATARS[value] || DEFAULT_AVATARS.prefer_not_to_say
      updateAvatar(defUrl)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // find or build paddleId / customPaddle
    let paddleId, customPaddle
    if (formData.paddle_brand && formData.paddle_model) {
      const { data } = await supabase
        .from('paddle_options')
        .select('id')
        .eq('brand', formData.paddle_brand)
        .eq('model', formData.paddle_model)
        .single()
      if (data) paddleId = data.id
      else customPaddle = `${formData.paddle_brand} ${formData.paddle_model}`.trim()
    }

    // upsert profile (including current context avatar_url)
    const { error: playerError } = await supabase
      .from('players')
      .upsert({
        user_id:           user.id,
        gender,
        rating_level:      formData.rating_level,
        play_style:        formData.play_style,
        handedness:        formData.handedness,
        paddle_id:         paddleId,
        custom_paddle:     customPaddle,
        play_format:       formData.play_format,
        favorite_player:   formData.favorite_player,
        preferred_surface: formData.preferred_surface,
        zipcode:           formData.zipcode,
        city:              formData.city,
        state:             formData.state,
        avatar_url:        user.avatar_url
      }, { onConflict: ['user_id'] })

    if (playerError) {
      setError(playerError.message)
      setLoading(false)
      return
    }

    navigate('/dashboard')
    setLoading(false)
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        {loading && (
          <div className="spinner-overlay">
            <LoadingSpinner />
          </div>
        )}

        <h2>Edit Your Profile</h2>
        <form onSubmit={handleSubmit} className="page-form">

          <select name="gender" value={gender} onChange={handleChange} required>
            <option value="">Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="nonbinary">Non-Binary</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>

          <AvatarUploader
            userId={user.id}
            avatarUrl={user.avatar_url}
            onUpload={updateAvatar}
            gender={gender}
          />

          <input
            type="text"
            name="zipcode"
            placeholder="Zip Code"
            value={formData.zipcode}
            onChange={handleChange}
          />

          <div className="form-row">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              disabled
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              disabled
            />
          </div>

          <select name="rating_level" value={formData.rating_level ?? ''} onChange={handleChange} required>
            <option value="">Rating Level</option>
            {["pro", "5.5", "5.0", "4.5", "4.0", "3.5", "3.0", "2.5", "2.0"].map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          <select name="play_style" value={formData.play_style ?? ''} onChange={handleChange} required>
            <option value="">Play Style</option>
            <option value="aggressive">Aggressive</option>
            <option value="defensive">Defensive</option>
            <option value="all-court">All-Court</option>
          </select>

          <select name="handedness" value={formData.handedness ?? ''} onChange={handleChange} required>
            <option value="">Handedness</option>
            <option value="right">Right</option>
            <option value="left">Left</option>
            <option value="ambidextrous">Ambidextrous</option>
          </select>

          <div className="form-row">
            <select name="paddle_brand" value={formData.paddle_brand ?? ''} onChange={handleChange} className="form-control">
              <option value="">Select Brand</option>
              {[...new Set(paddleOptions.map(p => p.brand))].map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select name="paddle_model" value={formData.paddle_model ?? ''} onChange={handleChange} className="form-control">
              <option value="">Select Model</option>
              {modelOptions.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <select name="play_format" value={formData.play_format ?? ''} onChange={handleChange} required>
            <option value="">Singles / Doubles</option>
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
            <option value="both">Both</option>
          </select>

          <input type="text" name="favorite_player" placeholder="Favorite Player" value={formData.favorite_player} onChange={handleChange} />

          <select name="preferred_surface" value={formData.preferred_surface ?? ''} onChange={handleChange} required>
            <option value="">Preferred Surface</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="either">Either</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
