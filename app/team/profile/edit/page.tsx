'use client'

import Link from 'next/link'
import { ArrowLeft, Upload, X, Loader2, AlertCircle, Check, Camera, Users } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    favorite_song: '',
    avatar_url: ''
  })

  useEffect(() => {
    const userStr = localStorage.getItem('team_user')
    if (!userStr) {
      router.push('/team')
      return
    }
    const userData = JSON.parse(userStr)
    setUser(userData)
    fetchProfile(userData.id)
  }, [router])

  async function fetchProfile(userId: number) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      setFormData({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        location: data.location || '',
        favorite_song: data.favorite_song || '',
        avatar_url: data.avatar_url || ''
      })
    } catch (error: any) {
      console.error('Error fetching profile:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File): Promise<string | null> {
    if (!file) return null

    setUploading(true)
    setUploadProgress(0)
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file)

      clearInterval(progressInterval)
      
      if (uploadError) throw uploadError

      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 500)

      const { data } = supabase.storage
        .from('music')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error: any) {
      alert('Upload failed: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      setFormData({...formData, avatar_url: url})
    }
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required'
    if (!formData.username.trim()) errors.username = 'Username is required'
    if (formData.username.includes(' ')) errors.username = 'Username cannot contain spaces'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveProfile() {
    if (!validateForm()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          bio: formData.bio || null,
          location: formData.location || null,
          favorite_song: formData.favorite_song || null,
          avatar_url: formData.avatar_url || null
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local storage
      const updatedUser = { ...user, ...formData }
      localStorage.setItem('team_user', JSON.stringify(updatedUser))

      alert('Profile updated successfully!')
      router.push('/team')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link 
            href="/team" 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
            Edit Profile
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-pink-200 border-4 border-pink-100">
                {formData.avatar_url ? (
                  <Image
                    src={formData.avatar_url}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera size={32} className="text-pink-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-700 transition shadow-md">
                <Upload size={14} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && (
              <div className="w-48 mt-2">
                <div className="h-1 bg-pink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                  formErrors.full_name ? 'border-red-300 bg-red-50' : 'border-pink-100'
                }`}
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
              {formErrors.full_name && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {formErrors.full_name}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">@</span>
                <input
                  type="text"
                  className={`w-full pl-8 p-3 border rounded-lg text-gray-800 bg-white ${
                    formErrors.username ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              {formErrors.username && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {formErrors.username}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                className="w-full p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                rows={3}
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                placeholder="e.g. Kampala, Uganda"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* Favorite Song */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Spice Song</label>
              <input
                type="text"
                className="w-full p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                placeholder="e.g. Siri Regular"
                value={formData.favorite_song}
                onChange={(e) => setFormData({...formData, favorite_song: e.target.value})}
              />
            </div>

            {/* Save Button */}
            <button
              onClick={saveProfile}
              disabled={saving || uploading}
              className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3.5 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}