import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import AvatarUploader from '../components/AvatarUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import maleAvatar from '../assets/avatars/male.png';
import femaleAvatar from '../assets/avatars/female.png';
import neutralAvatar from '../assets/avatars/neutral.png';
import '../App.css';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('');
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
  });
  const [paddleOptions, setPaddleOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      // ✅ Step 1: Get current user
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return navigate('/signup');
      setUserId(user.id);

      // ✅ Step 2: Load paddles
      const { data: allPaddles } = await supabase.from('paddle_options').select('brand, model');
      setPaddleOptions(allPaddles || []);

      // ✅ Step 3: Load player record (includes avatar + gender now)
      const { data: player } = await supabase.from('players').select('*').eq('user_id', user.id).single();
      if (player) {
        setFormData(prev => ({ ...prev, ...player }));
        setAvatarUrl(player.avatar_url || '');
        setGender(player.gender || '');

        if (player.paddle_id) {
          const { data: paddle } = await supabase
            .from('paddle_options')
            .select('brand, model')
            .eq('id', player.paddle_id)
            .single();

          if (paddle) {
            setFormData(prev => ({
              ...prev,
              paddle_brand: paddle.brand,
              paddle_model: paddle.model
            }));
          }
        } else if (player.custom_paddle) {
          const [brand, ...modelParts] = player.custom_paddle.split(' ');
          setFormData(prev => ({
            ...prev,
            paddle_brand: brand,
            paddle_model: modelParts.join(' ')
          }));
        }
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    const models = paddleOptions.filter(p => p.brand === formData.paddle_brand).map(p => p.model);
    setModelOptions(models);
  }, [formData.paddle_brand, paddleOptions]);

  useEffect(() => {
    const fetchLocation = async () => {
      if (formData.zipcode.length === 5) {
        try {
          const res = await fetch(`https://api.zippopotam.us/us/${formData.zipcode}`);
          const json = await res.json();
          setFormData(prev => ({
            ...prev,
            city: json.places?.[0]?.['place name'] || '',
            state: json.places?.[0]?.['state abbreviation'] || ''
          }));
        } catch {
          console.warn('ZIP lookup failed');
        }
      }
    };
    fetchLocation();
  }, [formData.zipcode]);

  const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));

  if (name === 'gender') {
    setGender(value);

    if (!avatarUrl || avatarUrl.includes('/avatars/')) {
      setAvatarUrl(
        value === 'female' ? femaleAvatar :
        value === 'male' ? maleAvatar :
        neutralAvatar
      );
    }
  }
};
  const handleAvatarUpload = (url) => {
    if (url) setAvatarUrl(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let paddleId = null;
    let customPaddle = null;

    if (formData.paddle_brand && formData.paddle_model) {
      const { data } = await supabase
        .from('paddle_options')
        .select('id')
        .eq('brand', formData.paddle_brand)
        .eq('model', formData.paddle_model)
        .single();

      if (data) {
        paddleId = data.id;
      } else {
        customPaddle = `${formData.paddle_brand} ${formData.paddle_model}`.trim();
      }
    }

    const { error: playerError } = await supabase
      .from('players')
      .upsert({
        user_id: userId,
        gender: gender,
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
      }, { onConflict: ['user_id'] });

    if (playerError) {
      setError(playerError.message);
    } else {
      window.dispatchEvent(new Event('profile-updated'))
      navigate('/dashboard');
    }

    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-wrapper">
      <div className="page-container">
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
            userId={userId}
            avatarUrl={avatarUrl}
            onUpload={handleAvatarUpload}
            gender={gender}
          />

          <input type="text" name="zipcode" placeholder="Zip Code" value={formData.zipcode} onChange={handleChange} />
          <div className="form-row">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                disabled
                className="form-control"
              />
              <input
                type="text"
                name="state"
                placeholder="State"
                value={formData.state}
                disabled
                className="form-control"
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
  );
}
