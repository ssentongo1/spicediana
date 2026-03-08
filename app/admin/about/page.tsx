'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit2, 
  Upload, 
  Mail, 
  Phone, 
  MapPin, 
  Heart,
  Music,
  Calendar,
  Briefcase,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Profile {
  name: string
  tagline: string
  bio: string
  born: string
  genre: string
  yearsActive: string
  label: string
  email: string
  phone: string
  location: string
  profileImage: string | null
}

export default function AdminAboutPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [profile, setProfile] = useState<Profile>({
    name: 'Spice Diana',
    tagline: 'The People\'s Princess',
    bio: 'Spice Diana, born Diana Nabatanzi, is one of East Africa\'s most celebrated musicians. Known for her unique blend of Afrobeat, dancehall, and pop, she has captivated audiences across Uganda and beyond. With multiple awards and hit songs, she continues to represent Ugandan music on the global stage.\n\nBeyond music, Spice is passionate about empowering young women through her foundation and various community initiatives.',
    born: 'Kampala, Uganda',
    genre: 'Afrobeat, Dancehall, Pop',
    yearsActive: '2018 - present',
    label: 'Spice Music',
    email: 'booking@spicediana.com',
    phone: '+256 700 000000',
    location: 'Kampala, Uganda',
    profileImage: null
  })

  const [originalProfile, setOriginalProfile] = useState<Profile>(profile)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (data) {
        const fetchedProfile = {
          name: data.name || 'Spice Diana',
          tagline: data.tagline || 'The People\'s Princess',
          bio: data.bio || profile.bio,
          born: data.born || 'Kampala, Uganda',
          genre: data.genre || 'Afrobeat, Dancehall, Pop',
          yearsActive: data.years_active || '2018 - present',
          label: data.label || 'Spice Music',
          email: data.email || 'booking@spicediana.com',
          phone: data.phone || '+256 700 000000',
          location: data.location || 'Kampala, Uganda',
          profileImage: data.profile_image || null
        }
        setProfile(fetchedProfile)
        setOriginalProfile(fetchedProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
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
      const fileName = `profile_${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

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
      setProfile({...profile, profileImage: url})
    }
  }

  function validateForm(): boolean {
    const newErrors: {[key: string]: string} = {}
    
    if (!profile.name.trim()) newErrors.name = 'Name is required'
    if (!profile.tagline.trim()) newErrors.tagline = 'Tagline is required'
    if (!profile.bio.trim()) newErrors.bio = 'Bio is required'
    if (!profile.email.trim()) newErrors.email = 'Email is required'
    if (!profile.email.includes('@')) newErrors.email = 'Invalid email format'
    if (!profile.phone.trim()) newErrors.phone = 'Phone is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function saveChanges() {
    if (!validateForm()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1,
          profile_image: profile.profileImage,
          name: profile.name,
          tagline: profile.tagline,
          bio: profile.bio,
          born: profile.born,
          genre: profile.genre,
          years_active: profile.yearsActive,
          label: profile.label,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          updated_at: new Date()
        })

      if (error) throw error

      setOriginalProfile(profile)
      setIsEditing(false)
      alert('Changes saved successfully!')
    } catch (error: any) {
      alert('Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setProfile(originalProfile)
    setIsEditing(false)
    setErrors({})
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile)

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                About Page Editor
              </h1>
              <p className="text-sm text-gray-500">Manage your public profile information</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-pink-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-pink-700 transition flex items-center gap-2 shadow-md"
            >
              <Edit2 size={18} />
              Edit Page
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={cancelEdit}
                className="border-2 border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={saveChanges}
                disabled={saving || !hasChanges}
                className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden mb-6">
          <div className="relative h-32 bg-gradient-to-r from-pink-600 to-pink-400">
            {/* Profile Image */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-pink-300 to-pink-400">
                  {profile.profileImage ? (
                    <Image 
                      src={profile.profileImage} 
                      alt={profile.name} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart size={32} className="text-white/80" />
                    </div>
                  )}
                </div>
                
                {/* Upload Button - Only visible in edit mode */}
                {isEditing && (
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
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-16 pb-6 px-6 text-center">
            {isEditing ? (
              <div className="space-y-3 max-w-md mx-auto">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-center text-gray-800 bg-white focus:outline-none focus:border-pink-300 ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="Full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.name}
                  </p>
                )}
                
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) => setProfile({...profile, tagline: e.target.value})}
                  className={`w-full px-4 py-2 border-2 rounded-lg text-center text-gray-800 bg-white focus:outline-none focus:border-pink-300 ${
                    errors.tagline ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="Tagline"
                />
                {errors.tagline && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.tagline}
                  </p>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{profile.name}</h2>
                <p className="text-pink-600 text-sm md:text-base mt-1">{profile.tagline}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Singer · Songwriter · Performer</p>
              </>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-3 flex items-center gap-2">
            <Heart size={16} className="text-pink-600" />
            Bio
          </h3>
          {isEditing ? (
            <>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className={`w-full p-4 border-2 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 ${
                  errors.bio ? 'border-red-300 bg-red-50' : 'border-pink-100'
                }`}
                rows={6}
                placeholder="Write about yourself..."
              />
              {errors.bio && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.bio}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3 text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
              {profile.bio}
            </div>
          )}
        </div>

        {/* Quick Facts */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-4">Quick Facts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Born */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Born</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.born}
                    onChange={(e) => setProfile({...profile, born: e.target.value})}
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300"
                  />
                ) : (
                  <p className="text-sm md:text-base text-gray-800">{profile.born}</p>
                )}
              </div>
            </div>

            {/* Genre */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Music size={14} className="text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Genre</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.genre}
                    onChange={(e) => setProfile({...profile, genre: e.target.value})}
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300"
                  />
                ) : (
                  <p className="text-sm md:text-base text-gray-800">{profile.genre}</p>
                )}
              </div>
            </div>

            {/* Years Active */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar size={14} className="text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Years active</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.yearsActive}
                    onChange={(e) => setProfile({...profile, yearsActive: e.target.value})}
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300"
                  />
                ) : (
                  <p className="text-sm md:text-base text-gray-800">{profile.yearsActive}</p>
                )}
              </div>
            </div>

            {/* Label */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Briefcase size={14} className="text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Label</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.label}
                    onChange={(e) => setProfile({...profile, label: e.target.value})}
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300"
                  />
                ) : (
                  <p className="text-sm md:text-base text-gray-800">{profile.label}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Booking */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-4">Booking & Inquiries</h3>
          
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 transition">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={14} className="text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Email</p>
                {isEditing ? (
                  <>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className={`w-full px-3 py-1 border-2 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-pink-100'
                      }`}
                      placeholder="email@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.email}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm md:text-base text-gray-800">{profile.email}</p>
                )}
              </div>
            </div>
            
            {/* Phone */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 transition">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone size={14} className="text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Phone</p>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className={`w-full px-3 py-1 border-2 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-pink-100'
                      }`}
                      placeholder="+256 700 000000"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.phone}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm md:text-base text-gray-800">{profile.phone}</p>
                )}
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-pink-50 transition">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Location</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile({...profile, location: e.target.value})}
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300"
                  />
                ) : (
                  <p className="text-sm md:text-base text-gray-800">{profile.location}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Press Kit Section */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-4">Press Kit</h3>
          {isEditing ? (
            <div className="border-2 border-dashed border-pink-200 rounded-xl p-6 text-center hover:border-pink-300 transition">
              <Upload size={24} className="mx-auto text-pink-400 mb-2" />
              <p className="text-sm text-gray-600">Click to upload press kit PDF</p>
              <p className="text-xs text-gray-400 mt-1">PDF up to 10MB</p>
              <input type="file" accept=".pdf" className="hidden" />
            </div>
          ) : (
            <button className="w-full border-2 border-pink-600 text-pink-600 py-3 rounded-xl font-medium hover:bg-pink-50 transition flex items-center justify-center gap-2">
              <span>Download Press Kit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}