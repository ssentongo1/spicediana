'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Crown,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  Send,
  Users,
  Megaphone
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Profile {
  id: number
  username: string
  email: string
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
  is_spice: boolean
  is_admin: boolean
}

export default function AdminSpicePage() {
  const [spiceProfile, setSpiceProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState<string | null>(null)
  const [postDestination, setPostDestination] = useState<'team' | 'official'>('team')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSpiceProfile()
  }, [])

  async function fetchSpiceProfile() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_spice', true)
        .single()

      setSpiceProfile(data)
    } catch (error) {
      console.error('Error fetching spice profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createSpiceAccount() {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          username: 'spice_diana',
          email: 'spice@diana.com',
          full_name: 'Spice Diana',
          is_verified: true,
          is_spice: true,
          is_admin: true
        }])

      if (error) throw error
      await fetchSpiceProfile()
      alert('Spice account created successfully!')
    } catch (error: any) {
      alert('Error creating account: ' + error.message)
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    if (!file) return null

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `spice_${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('music')
        .getPublicUrl(filePath)

      // Update profile with new avatar
      if (spiceProfile?.id) {
        await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl })
          .eq('id', spiceProfile.id)
      }

      await fetchSpiceProfile()
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
    await uploadImage(file)
  }

  async function handlePostAsSpice() {
    if (!spiceProfile?.id) return

    if (!newPost.trim() && !postImage) {
      alert('Please write something or add an image')
      return
    }

    setSubmitting(true)
    try {
      if (postDestination === 'team') {
        // Post to Team Spice
        const { error } = await supabase
          .from('community_posts')
          .insert([{
            user_id: spiceProfile.id,
            content: newPost.trim() || null,
            image_url: postImage,
            status: 'approved' // Auto-approved for Spice
          }])
        if (error) throw error
        alert('Posted to Team Spice!')
      } else {
        // Post to Official Communications with user_id
        const { error } = await supabase
          .from('announcements')
          .insert([{
            title: '✨ Message from Spice',
            content: newPost.trim() || '✨',
            type: 'general',
            date: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            urgent: false,
            user_id: spiceProfile.id // This links the post to Spice's profile
          }])
        if (error) throw error
        alert('Posted to Official Communications!')
      }

      setNewPost('')
      setPostImage(null)
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSubmitting(false)
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
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-pink-600">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              Spice's Account
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!spiceProfile ? (
          <div className="bg-white rounded-xl p-12 text-center border border-pink-100">
            <Crown size={48} className="mx-auto text-pink-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">No Spice Account Yet</h2>
            <p className="text-gray-500 mb-6">Create an official account for Spice Diana</p>
            <button
              onClick={createSpiceAccount}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition"
            >
              Create Spice Account
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="relative w-24 h-24 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full overflow-hidden">
                    {spiceProfile.avatar_url ? (
                      <Image 
                        src={spiceProfile.avatar_url} 
                        alt="Spice" 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Crown size={32} className="text-white" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-700 transition">
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
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-gray-800">{spiceProfile.full_name}</h2>
                    <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                      <Crown size={10} />
                      Verified
                    </span>
                  </div>
                  <p className="text-gray-500">@{spiceProfile.username}</p>
                </div>
              </div>
            </div>

            {/* Post as Spice with Destination Selector */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Crown size={18} className="text-yellow-500" />
                Create a Post
              </h3>

              {/* Destination Selector */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setPostDestination('team')}
                  className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    postDestination === 'team'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-pink-50 text-gray-600 hover:bg-pink-100'
                  }`}
                >
                  <Users size={18} />
                  Team Spice
                </button>
                <button
                  onClick={() => setPostDestination('official')}
                  className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    postDestination === 'official'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-blue-50 text-gray-600 hover:bg-blue-100'
                  }`}
                >
                  <Megaphone size={18} />
                  Official
                </button>
              </div>

              <textarea
                placeholder={postDestination === 'team' 
                  ? "Share something with your fans in Team Spice..." 
                  : "Share an official announcement with all fans..."}
                className="w-full p-3 border border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400"
                rows={3}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />

              {postImage && (
                <div className="relative mt-3">
                  <div className="relative h-32 bg-pink-100 rounded-lg overflow-hidden">
                    <Image src={postImage} alt="Preview" fill className="object-cover" />
                  </div>
                  <button
                    onClick={() => setPostImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const url = await uploadImage(file)
                        if (url) setPostImage(url)
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition">
                    <ImageIcon size={18} />
                    <span className="text-sm">Add Photo</span>
                  </div>
                </label>

                <button
                  onClick={handlePostAsSpice}
                  disabled={submitting || uploading}
                  className={`px-6 py-2 rounded-lg font-medium hover:shadow-lg transition flex items-center gap-2 ${
                    postDestination === 'team'
                      ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                  }`}
                >
                  <Send size={16} />
                  Post to {postDestination === 'team' ? 'Team Spice' : 'Official'}
                </button>
              </div>

              {/* Preview Note */}
              <p className="text-xs text-gray-400 mt-3">
                {postDestination === 'team' 
                  ? '✨ This will appear in the Team Spice community feed'
                  : '📢 This will appear in Official Communications with a special "Message from Spice" title'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}