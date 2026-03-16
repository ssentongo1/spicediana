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
  AlertCircle,
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Globe,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  GripVertical,
  ExternalLink
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
  socialTotal: string
}

interface SocialPlatform {
  id: number
  platform: string
  username: string
  url: string
  followers: number
  icon: string
  is_active: boolean
  display_order: number
}

// Platform options
const platformOptions = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500' },
  { value: 'twitter', label: 'X (Twitter)', icon: Music2, color: 'from-gray-800 to-gray-900' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
  { value: 'tiktok', label: 'TikTok', icon: Music2, color: 'from-gray-900 to-pink-500' },
  { value: 'spotify', label: 'Spotify', icon: Music2, color: 'from-green-500 to-green-600' },
  { value: 'apple', label: 'Apple Music', icon: Music2, color: 'from-gray-700 to-gray-800' },
  { value: 'boomplay', label: 'Boomplay', icon: Music2, color: 'from-orange-500 to-red-500' },
  { value: 'audiomack', label: 'Audiomack', icon: Music2, color: 'from-yellow-500 to-orange-500' },
  { value: 'deezer', label: 'Deezer', icon: Music2, color: 'from-purple-600 to-pink-500' },
  { value: 'amazon', label: 'Amazon Music', icon: Music2, color: 'from-orange-500 to-orange-600' },
  { value: 'other', label: 'Other', icon: Globe, color: 'from-pink-400 to-pink-500' }
]

// Custom TikTok icon component
const TikTokIcon = ({ size = 18, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M19.59 6.69C18.95 6.26 18.47 5.66 18.16 5C17.85 4.34 17.73 3.62 17.81 2.9H14.43V15.53C14.43 16.41 14.15 17.27 13.64 17.97C13.13 18.67 12.41 19.18 11.59 19.42C10.77 19.66 9.9 19.62 9.1 19.31C8.3 19 7.61 18.43 7.13 17.69C6.65 16.95 6.41 16.08 6.44 15.19C6.47 14.3 6.77 13.44 7.29 12.73C7.81 12.02 8.53 11.49 9.35 11.22C10.17 10.95 11.06 10.95 11.88 11.22V7.8C10.06 7.63 8.25 8.2 6.89 9.35C5.53 10.5 4.75 12.15 4.75 13.89C4.75 15.63 5.53 17.28 6.89 18.43C8.25 19.58 10.06 20.15 11.88 19.98C13.7 19.81 15.38 18.92 16.52 17.54C17.66 16.16 18.18 14.39 18.18 12.58V7.7C19.11 8.32 20.18 8.67 21.27 8.71V5.29C20.62 5.29 19.99 5.08 19.59 4.69V6.69Z" 
      fill="currentColor"
    />
  </svg>
)

// Format number for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
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
    profileImage: null,
    socialTotal: '10M+'
  })

  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatform[]>([])
  const [originalSocialPlatforms, setOriginalSocialPlatforms] = useState<SocialPlatform[]>([])
  const [originalProfile, setOriginalProfile] = useState<Profile>(profile)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    fetchProfile()
    fetchSocialPlatforms()
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
          profileImage: data.profile_image || null,
          socialTotal: data.social_total || '10M+'
        }
        setProfile(fetchedProfile)
        setOriginalProfile(fetchedProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  async function fetchSocialPlatforms() {
    try {
      const { data } = await supabase
        .from('social_stats')
        .select('*')
        .order('display_order', { ascending: true })

      if (data) {
        setSocialPlatforms(data)
        setOriginalSocialPlatforms(data)
      }
    } catch (error) {
      console.error('Error fetching social platforms:', error)
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

  // Social platform handlers
  function addSocialPlatform() {
    const newPlatform: SocialPlatform = {
      id: Date.now(), // temporary ID
      platform: 'instagram',
      username: '',
      url: '',
      followers: 0,
      icon: 'instagram',
      is_active: true,
      display_order: socialPlatforms.length
    }
    setSocialPlatforms([...socialPlatforms, newPlatform])
  }

  function removeSocialPlatform(index: number) {
    const updated = socialPlatforms.filter((_, i) => i !== index)
    // Update display order
    updated.forEach((p, i) => { p.display_order = i })
    setSocialPlatforms(updated)
  }

  function updateSocialPlatform(index: number, field: keyof SocialPlatform, value: any) {
    const updated = [...socialPlatforms]
    updated[index] = { ...updated[index], [field]: value }
    
    // Auto-generate URL if username is provided and URL is empty
    if (field === 'username' && value && !updated[index].url) {
      const platform = updated[index].platform
      const username = value.replace('@', '')
      
      const urlMap: {[key: string]: string} = {
        instagram: `https://instagram.com/${username}`,
        twitter: `https://twitter.com/${username}`,
        facebook: `https://facebook.com/${username}`,
        youtube: `https://youtube.com/@${username}`,
        tiktok: `https://tiktok.com/@${username}`,
        spotify: `https://open.spotify.com/artist/${username}`,
        apple: `https://music.apple.com/artist/${username}`,
        boomplay: `https://boomplay.com/artist/${username}`,
        audiomack: `https://audiomack.com/${username}`,
        deezer: `https://deezer.com/artist/${username}`,
        amazon: `https://music.amazon.com/artists/${username}`
      }
      
      updated[index].url = urlMap[platform] || ''
    }
    
    setSocialPlatforms(updated)
  }

  function movePlatformUp(index: number) {
    if (index === 0) return
    const updated = [...socialPlatforms]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    
    // Update display_order
    updated.forEach((p, i) => { p.display_order = i })
    
    setSocialPlatforms(updated)
  }

  function movePlatformDown(index: number) {
    if (index === socialPlatforms.length - 1) return
    const updated = [...socialPlatforms]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    
    // Update display_order
    updated.forEach((p, i) => { p.display_order = i })
    
    setSocialPlatforms(updated)
  }

  function validateForm(): boolean {
    const newErrors: {[key: string]: string} = {}
    
    if (!profile.name.trim()) newErrors.name = 'Name is required'
    if (!profile.tagline.trim()) newErrors.tagline = 'Tagline is required'
    if (!profile.bio.trim()) newErrors.bio = 'Bio is required'
    if (!profile.email.trim()) newErrors.email = 'Email is required'
    if (!profile.email.includes('@')) newErrors.email = 'Invalid email format'
    if (!profile.phone.trim()) newErrors.phone = 'Phone is required'

    // Validate social platforms
    socialPlatforms.forEach((platform, index) => {
      if (!platform.username.trim()) {
        newErrors[`platform_${index}_username`] = 'Username is required'
      }
      if (!platform.url.trim()) {
        newErrors[`platform_${index}_url`] = 'URL is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function saveChanges() {
    if (!validateForm()) return

    setSaving(true)
    try {
      // Save profile settings
      const { error: profileError } = await supabase
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
          social_total: profile.socialTotal,
          updated_at: new Date()
        })

      if (profileError) throw profileError

      // Save social platforms
      // Delete all existing and insert new ones
      const { error: deleteError } = await supabase
        .from('social_stats')
        .delete()
        .neq('id', 0) // Delete all

      if (deleteError) throw deleteError

      if (socialPlatforms.length > 0) {
        const platformsToInsert = socialPlatforms.map(p => ({
          platform: p.platform,
          username: p.username,
          url: p.url,
          followers: p.followers || 0,
          icon: p.icon,
          is_active: p.is_active,
          display_order: p.display_order
        }))

        const { error: insertError } = await supabase
          .from('social_stats')
          .insert(platformsToInsert)

        if (insertError) throw insertError
      }

      setOriginalProfile(profile)
      setOriginalSocialPlatforms(socialPlatforms)
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
    setSocialPlatforms(originalSocialPlatforms)
    setIsEditing(false)
    setErrors({})
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile) ||
                     JSON.stringify(socialPlatforms) !== JSON.stringify(originalSocialPlatforms)

  // Calculate total followers
  const totalFollowers = socialPlatforms.reduce((sum, p) => sum + (p.followers || 0), 0)
  const formattedTotal = totalFollowers >= 1000000 
    ? (totalFollowers / 1000000).toFixed(1) + 'M' 
    : totalFollowers >= 1000 
      ? (totalFollowers / 1000).toFixed(1) + 'K' 
      : totalFollowers.toString()

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
                  className={`w-full px-4 py-2 border-2 rounded-lg text-center text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="Enter full name"
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
                  className={`w-full px-4 py-2 border-2 rounded-lg text-center text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 ${
                    errors.tagline ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="Enter tagline"
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
                className={`w-full p-4 border-2 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 ${
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

        {/* ===== SOCIAL MEDIA MANAGEMENT SECTION ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800 text-base md:text-lg flex items-center gap-2">
                <Users size={18} className="text-pink-600" />
                Social Media Platforms
              </h3>
              <p className="text-xs text-gray-500 mt-1">Manage your social media links and follower counts</p>
            </div>
            
            {/* Total Reach Display */}
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 px-4 py-2 rounded-lg">
              <p className="text-xs text-gray-600">Total Reach</p>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.socialTotal}
                  onChange={(e) => setProfile({...profile, socialTotal: e.target.value})}
                  className="w-24 px-2 py-1 border border-pink-200 rounded text-sm font-bold text-pink-600 bg-white placeholder-gray-400"
                  placeholder="10M+"
                />
              ) : (
                <p className="font-bold text-pink-600">{profile.socialTotal}</p>
              )}
            </div>
          </div>

          {isEditing ? (
            <>
              {/* Social Platforms List */}
              <div className="space-y-3 mb-4">
                {socialPlatforms.map((platform, index) => {
                  const platformOption = platformOptions.find(p => p.value === platform.platform) || platformOptions[platformOptions.length - 1]
                  const Icon = platform.platform === 'tiktok' ? TikTokIcon : (platformOption?.icon || Globe)
                  
                  return (
                    <div key={platform.id} className="bg-pink-50/50 rounded-xl p-4 border-2 border-pink-100">
                      <div className="flex items-start gap-3">
                        {/* Drag handle */}
                        <div className="mt-2 cursor-move text-gray-400">
                          <GripVertical size={18} />
                        </div>

                        {/* Platform Icon Preview */}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${platformOption?.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={18} className="text-white" />
                        </div>

                        {/* Platform Fields */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Platform Select */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Platform</label>
                            <select
                              value={platform.platform}
                              onChange={(e) => updateSocialPlatform(index, 'platform', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-pink-100 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-300 text-gray-800"
                            >
                              {platformOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Username */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Username/Handle</label>
                            <input
                              type="text"
                              value={platform.username}
                              onChange={(e) => updateSocialPlatform(index, 'username', e.target.value)}
                              className={`w-full px-3 py-2 border-2 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 text-gray-800 ${
                                errors[`platform_${index}_username`] ? 'border-red-300 bg-red-50' : 'border-pink-100'
                              }`}
                              placeholder="@username"
                            />
                          </div>

                          {/* URL */}
                          <div className="md:col-span-2">
                            <label className="text-xs text-gray-500 mb-1 block">Profile URL</label>
                            <input
                              type="url"
                              value={platform.url}
                              onChange={(e) => updateSocialPlatform(index, 'url', e.target.value)}
                              className={`w-full px-3 py-2 border-2 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 text-gray-800 ${
                                errors[`platform_${index}_url`] ? 'border-red-300 bg-red-50' : 'border-pink-100'
                              }`}
                              placeholder="https://..."
                            />
                          </div>

                          {/* Followers */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">Follower Count</label>
                            <input
                              type="number"
                              value={platform.followers || 0}
                              onChange={(e) => updateSocialPlatform(index, 'followers', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border-2 border-pink-100 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 text-gray-800"
                              min="0"
                              step="1"
                              placeholder="0"
                            />
                          </div>

                          {/* Active Status */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`active-${index}`}
                              checked={platform.is_active}
                              onChange={(e) => updateSocialPlatform(index, 'is_active', e.target.checked)}
                              className="w-4 h-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
                            />
                            <label htmlFor={`active-${index}`} className="text-sm text-gray-600">
                              Active
                            </label>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => movePlatformUp(index)}
                            disabled={index === 0}
                            className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-lg transition disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => movePlatformDown(index)}
                            disabled={index === socialPlatforms.length - 1}
                            className="p-1.5 text-gray-500 hover:text-pink-600 hover:bg-pink-100 rounded-lg transition disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeSocialPlatform(index)}
                            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Error messages */}
                      <div className="mt-2 space-y-1">
                        {errors[`platform_${index}_username`] && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={10} />
                            {errors[`platform_${index}_username`]}
                          </p>
                        )}
                        {errors[`platform_${index}_url`] && (
                          <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={10} />
                            {errors[`platform_${index}_url`]}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add Platform Button */}
              <button
                onClick={addSocialPlatform}
                className="w-full border-2 border-dashed border-pink-200 rounded-xl p-4 text-pink-600 hover:border-pink-300 hover:bg-pink-50 transition flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Social Platform
              </button>
            </>
          ) : (
            /* View Mode - Show platforms as cards */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {socialPlatforms.filter(p => p.is_active).map((platform) => {
                const platformOption = platformOptions.find(p => p.value === platform.platform) || platformOptions[platformOptions.length - 1]
                const Icon = platform.platform === 'tiktok' ? TikTokIcon : (platformOption?.icon || Globe)
                
                return (
                  <a
                    key={platform.id}
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-gradient-to-br from-gray-50 to-white border border-pink-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${platformOption?.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${platformOption?.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    
                    <p className="text-xs font-medium text-gray-500 mb-1 capitalize">{platform.platform}</p>
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      {formatNumber(platform.followers || 0)}
                    </p>
                    
                    <div className="flex items-center gap-1 text-[10px] font-medium text-pink-600 group-hover:gap-2 transition-all">
                      <span>@{platform.username}</span>
                      <ExternalLink size={8} />
                    </div>
                  </a>
                )
              })}
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
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400"
                    placeholder="City, Country"
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
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400"
                    placeholder="Afrobeat, Dancehall"
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
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400"
                    placeholder="2018 - present"
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
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400"
                    placeholder="Record Label"
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
                      className={`w-full px-3 py-1 border-2 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 ${
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
                      className={`w-full px-3 py-1 border-2 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400 ${
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
                    className="w-full px-3 py-1 border-2 border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400"
                    placeholder="Kampala, Uganda"
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