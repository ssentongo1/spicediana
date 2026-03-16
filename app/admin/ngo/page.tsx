'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload,
  Image as ImageIcon,
  Film,
  MapPin,
  Calendar,
  Heart,
  MoveUp,
  MoveDown,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

interface NGOPost {
  id: number
  title: string
  content: string
  media_url: string | null
  media_type: 'image' | 'video'
  campaign_name: string | null
  location: string | null
  date: string | null
  is_active: boolean
  display_order: number
}

export default function AdminNGOPage() {
  const [posts, setPosts] = useState<NGOPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<NGOPost | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    campaign_name: '',
    location: '',
    date: '',
    is_active: true
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('ngo_posts')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setPosts(data || [])
    } catch (error: any) {
      console.error('Error fetching posts:', error.message)
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
      const fileName = `ngo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `ngo/${fileName}`

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

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      setFormData({...formData, media_url: url})
    }
  }

  async function movePost(id: number, direction: 'up' | 'down') {
    const currentIndex = posts.findIndex(p => p.id === id)
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === posts.length - 1)
    ) return

    const newPosts = [...posts]
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    const tempOrder = newPosts[currentIndex].display_order
    newPosts[currentIndex].display_order = newPosts[swapIndex].display_order
    newPosts[swapIndex].display_order = tempOrder

    ;[newPosts[currentIndex], newPosts[swapIndex]] = [newPosts[swapIndex], newPosts[currentIndex]]

    setPosts(newPosts)

    await supabase
      .from('ngo_posts')
      .update({ display_order: newPosts[currentIndex].display_order })
      .eq('id', newPosts[currentIndex].id)

    await supabase
      .from('ngo_posts')
      .update({ display_order: newPosts[swapIndex].display_order })
      .eq('id', newPosts[swapIndex].id)
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.title) errors.title = 'Title is required'
    if (!formData.content) errors.content = 'Description is required'
    if (!formData.media_url) errors.media_url = 'Media file is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function savePost() {
    if (!validateForm()) return

    try {
      const maxOrder = posts.length > 0 ? Math.max(...posts.map(p => p.display_order)) : 0
      const postData = {
        title: formData.title,
        content: formData.content,
        media_url: formData.media_url,
        media_type: formData.media_type,
        campaign_name: formData.campaign_name || null,
        location: formData.location || null,
        date: formData.date || null,
        is_active: formData.is_active,
        display_order: editingItem ? editingItem.display_order : maxOrder + 1
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('ngo_posts')
          .update(postData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('ngo_posts')
          .insert([postData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchPosts()
      alert(editingItem ? 'Post updated!' : 'Post added!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function toggleActive(id: number, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('ngo_posts')
        .update({ is_active: !currentActive })
        .eq('id', id)

      if (error) throw error
      fetchPosts()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deletePost(id: number) {
    if (!confirm('Delete this post?')) return

    try {
      const { error } = await supabase
        .from('ngo_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPosts()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      media_url: '',
      media_type: 'image',
      campaign_name: '',
      location: '',
      date: '',
      is_active: true
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editPost(post: NGOPost) {
    setFormData({
      title: post.title,
      content: post.content,
      media_url: post.media_url || '',
      media_type: post.media_type,
      campaign_name: post.campaign_name || '',
      location: post.location || '',
      date: post.date || '',
      is_active: post.is_active
    })
    setEditingItem(post)
    setShowForm(true)
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
              NGO / Foundation
            </h1>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Post
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="p-6 border-b border-pink-100">
            <h2 className="font-semibold text-gray-800">Foundation Posts</h2>
            <p className="text-sm text-gray-500 mt-1">Share photos and videos from charity work</p>
          </div>

          <div className="divide-y divide-pink-100">
            {posts.map((post) => (
              <div key={post.id} className="p-4 flex items-center justify-between hover:bg-pink-50/50 transition">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => movePost(post.id, 'up')}
                      className="text-gray-400 hover:text-pink-600 transition"
                      disabled={posts.indexOf(post) === 0}
                    >
                      <MoveUp size={16} />
                    </button>
                    <button
                      onClick={() => movePost(post.id, 'down')}
                      className="text-gray-400 hover:text-pink-600 transition"
                      disabled={posts.indexOf(post) === posts.length - 1}
                    >
                      <MoveDown size={16} />
                    </button>
                  </div>
                  <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${
                    post.is_active ? 'bg-pink-100' : 'bg-gray-100'
                  }`}>
                    {post.media_url && post.media_type === 'image' ? (
                      <Image 
                        src={post.media_url} 
                        alt={post.title} 
                        width={48} 
                        height={48} 
                        className="object-cover"
                      />
                    ) : post.media_type === 'video' ? (
                      <Film size={24} className={post.is_active ? 'text-pink-600' : 'text-gray-400'} />
                    ) : (
                      <Heart size={24} className={post.is_active ? 'text-pink-600' : 'text-gray-400'} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{post.title}</h3>
                    <p className="text-xs text-gray-500 truncate max-w-sm">
                      {post.campaign_name && `${post.campaign_name} · `}
                      {post.location && `${post.location} · `}
                      {post.date && post.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(post.id, post.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      post.is_active 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {post.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => editPost(post)}
                    className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="p-12 text-center">
                <Heart size={40} className="mx-auto text-pink-300 mb-3" />
                <p className="text-gray-500">No foundation posts yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingItem ? 'Edit' : 'Add New'} Foundation Post
            </h2>

            <div className="space-y-4">
              {/* Media Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, media_type: 'image'})}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                      formData.media_type === 'image'
                        ? 'border-pink-600 bg-pink-50'
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <ImageIcon size={20} className={formData.media_type === 'image' ? 'text-pink-600' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${formData.media_type === 'image' ? 'text-pink-600' : 'text-gray-700'}`}>
                      Image
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, media_type: 'video'})}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                      formData.media_type === 'video'
                        ? 'border-pink-600 bg-pink-50'
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <Film size={20} className={formData.media_type === 'video' ? 'text-pink-600' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${formData.media_type === 'video' ? 'text-pink-600' : 'text-gray-700'}`}>
                      Video
                    </span>
                  </button>
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload {formData.media_type === 'image' ? 'Photo' : 'Video'}
                </label>
                <div className="relative">
                  {formData.media_url ? (
                    <div className="relative w-full h-40 bg-pink-100 rounded-lg overflow-hidden group">
                      {formData.media_type === 'image' ? (
                        <Image 
                          src={formData.media_url} 
                          alt="Preview" 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <video 
                          src={formData.media_url} 
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setFormData({...formData, media_url: ''})}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                        <label className="bg-white text-gray-700 p-2 rounded-full hover:bg-pink-50 transition cursor-pointer">
                          <Upload size={16} />
                          <input 
                            type="file"
                            accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
                            onChange={handleMediaUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-pink-300 transition cursor-pointer block bg-pink-50/50">
                      <Upload size={24} className="mx-auto text-pink-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload {formData.media_type}</p>
                      <p className="text-xs text-gray-400">
                        {formData.media_type === 'image' ? 'PNG, JPG up to 5MB' : 'MP4 up to 20MB'}
                      </p>
                      <input 
                        type="file"
                        accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {formErrors.media_url && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.media_url}
                  </p>
                )}
                {uploading && (
                  <div className="mt-2">
                    <div className="h-1 bg-pink-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300"
                        style={{width: `${uploadProgress}%`}}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                    formErrors.title ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="e.g. Girls Can Code Initiative"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                    formErrors.content ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  rows={3}
                  placeholder="Tell the story of this campaign..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
                {formErrors.content && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.content}
                  </p>
                )}
              </div>

              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name (optional)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                  placeholder="e.g. Girls Can Code 2024"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({...formData, campaign_name: e.target.value})}
                />
              </div>

              {/* Location & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-8 p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                      placeholder="Kampala, Uganda"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-8 p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                      placeholder="March 2024"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-pink-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (visible on site)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={savePost}
                  disabled={uploading}
                  className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50"
                >
                  {editingItem ? 'Update' : 'Add'} Post
                </button>
                <button
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}