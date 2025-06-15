import { useRef, useState } from 'react'
import supabase from '../supabaseClient'
import maleAvatar from '../assets/avatars/male.png'
import femaleAvatar from '../assets/avatars/female.png'
import neutralAvatar from '../assets/avatars/neutral.png'
import '../App.css'

export default function AvatarUploader({ userId, avatarUrl, onUpload, gender = '' }) {
  const fileInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  const getDefaultAvatar = () => {
    if (gender === 'male') return maleAvatar
    if (gender === 'female') return femaleAvatar
    return neutralAvatar
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/avatar.${fileExt}`

    setUploading(true)
    setPreviewUrl(URL.createObjectURL(file))

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    if (onUpload) onUpload(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="avatar-uploader" onClick={() => fileInputRef.current.click()}>
      <img
        src={previewUrl || avatarUrl || getDefaultAvatar()}
        alt="Avatar"
        className={`profile-avatar ${uploading ? 'avatar-loading' : ''}`}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
      />
      <div className="avatar-overlay">{uploading ? 'Uploading…' : 'Edit'}</div>
    </div>
  )
}
