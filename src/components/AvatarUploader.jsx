// File: src/components/AvatarUploader.jsx
import { useRef, useState } from 'react'
import supabase from '../supabaseClient'
import maleAvatar    from '../assets/avatars/male.png'
import femaleAvatar  from '../assets/avatars/female.png'
import neutralAvatar from '../assets/avatars/neutral.png'
import '../App.css'

export default function AvatarUploader({ userId, avatarUrl, onUpload, gender = '' }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const getDefaultAvatar = () => {
    if (gender === 'male')   return maleAvatar
    if (gender === 'female') return femaleAvatar
    return neutralAvatar
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`

    setUploading(true)
    try {
      // 1) Upload to storage
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      // 2) Get the public URL
      const { data } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      // 3) Notify parent & keep it as the one true src
      if (onUpload) onUpload(publicUrl)
    } catch (err) {
      console.error('Avatar upload failed:', err.message || err)
    } finally {
      setUploading(false)
    }
  }

  // We never switch to local preview URL—just fall back to props or default
  const src = avatarUrl || getDefaultAvatar()

  return (
    <div className="avatar-uploader" onClick={() => fileInputRef.current.click()}>
      <img
        src={src}
        alt="Avatar"
        className="profile-avatar"
        width={80}
        height={80}
      />
      {uploading && <div className="avatar-overlay">Uploading…</div>}
      {!uploading && <div className="avatar-overlay">Edit</div>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
