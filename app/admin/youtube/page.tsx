'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  MoveUp,
  MoveDown,
  Youtube,
  Play,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

interface YouTubeVideo {
  id: number
  title: string
  description: string | null
  youtube_url: string
  youtube_id: string
  thumbnail_url: string | null
  is_active: boolean
  display_order: number
}

export default function AdminYouTubePage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<YouTubeVideo | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    youtube_id: '',
    thumbnail_url: '',
    is_active: true
  })

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    try {
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setVideos(data || [])
    } catch (error: any) {
      console.error('Error fetching videos:', error.message)
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
      const fileName = `youtube_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `youtube/${fileName}`

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
      setFormData({...formData, thumbnail_url: url})
    }
  }

  function extractYoutubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  async function moveVideo(id: number, direction: 'up' | 'down') {
    const currentIndex = videos.findIndex(v => v.id === id)
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === videos.length - 1)
    ) return

    const newVideos = [...videos]
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    const tempOrder = newVideos[currentIndex].display_order
    newVideos[currentIndex].display_order = newVideos[swapIndex].display_order
    newVideos[swapIndex].display_order = tempOrder

    ;[newVideos[currentIndex], newVideos[swapIndex]] = [newVideos[swapIndex], newVideos[currentIndex]]

    setVideos(newVideos)

    await supabase
      .from('youtube_videos')
      .update({ display_order: newVideos[currentIndex].display_order })
      .eq('id', newVideos[currentIndex].id)

    await supabase
      .from('youtube_videos')
      .update({ display_order: newVideos[swapIndex].display_order })
      .eq('id', newVideos[swapIndex].id)
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.title) errors.title = 'Title is required'
    if (!formData.youtube_url) errors.youtube_url = 'YouTube URL is required'
    if (!formData.thumbnail_url) errors.thumbnail_url = 'Thumbnail image is required'

    // Extract YouTube ID to validate URL
    const videoId = extractYoutubeId(formData.youtube_url)
    if (!videoId) {
      errors.youtube_url = 'Invalid YouTube URL'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveVideo() {
    if (!validateForm()) return

    try {
      const videoId = extractYoutubeId(formData.youtube_url)
      const maxOrder = videos.length > 0 ? Math.max(...videos.map(v => v.display_order)) : 0
      
      const videoData = {
        title: formData.title,
        description: formData.description || null,
        youtube_url: formData.youtube_url,
        youtube_id: videoId,
        thumbnail_url: formData.thumbnail_url,
        is_active: formData.is_active,
        display_order: editingItem ? editingItem.display_order : maxOrder + 1
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('youtube_videos')
          .update(videoData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('youtube_videos')
          .insert([videoData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchVideos()
      alert(editingItem ? 'Video updated!' : 'Video added!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function toggleActive(id: number, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('youtube_videos')
        .update({ is_active: !currentActive })
        .eq('id', id)

      if (error) throw error
      fetchVideos()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteVideo(id: number) {
    if (!confirm('Delete this video?')) return

    try {
      const { error } = await supabase
        .from('youtube_videos')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchVideos()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      youtube_url: '',
      youtube_id: '',
      thumbnail_url: '',
      is_active: true
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editVideo(video: YouTubeVideo) {
    setFormData({
      title: video.title,
      description: video.description || '',
      youtube_url: video.youtube_url,
      youtube_id: video.youtube_id,
      thumbnail_url: video.thumbnail_url || '',
      is_active: video.is_active
    })
    setEditingItem(video)
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
              YouTube Videos
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
            Add Video
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="p-6 border-b border-pink-100">
            <h2 className="font-semibold text-gray-800">Manage YouTube Videos</h2>
            <p className="text-sm text-gray-500 mt-1">Add videos to appear on home page</p>
          </div>

          <div className="divide-y divide-pink-100">
            {videos.map((video) => (
              <div key={video.id} className="p-4 flex items-center justify-between hover:bg-pink-50/50 transition">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveVideo(video.id, 'up')}
                      className="text-gray-400 hover:text-pink-600 transition"
                      disabled={videos.indexOf(video) === 0}
                    >
                      <MoveUp size={16} />
                    </button>
                    <button
                      onClick={() => moveVideo(video.id, 'down')}
                      className="text-gray-400 hover:text-pink-600 transition"
                      disabled={videos.indexOf(video) === videos.length - 1}
                    >
                      <MoveDown size={16} />
                    </button>
                  </div>
                  <div className="relative w-16 h-10 bg-gray-100 rounded overflow-hidden">
                    {video.thumbnail_url ? (
                      <Image 
                        src={video.thumbnail_url} 
                        alt={video.title} 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Youtube size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{video.title}</h3>
                    <p className="text-xs text-gray-500 truncate max-w-sm">{video.youtube_url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(video.id, video.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      video.is_active 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {video.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => editVideo(video)}
                    className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteVideo(video.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {videos.length === 0 && (
              <div className="p-12 text-center">
                <Youtube size={40} className="mx-auto text-pink-300 mb-3" />
                <p className="text-gray-500">No YouTube videos added yet</p>
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
              {editingItem ? 'Edit' : 'Add'} YouTube Video
            </h2>

            <div className="space-y-4">
              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video Thumbnail</label>
                <div className="relative">
                  {formData.thumbnail_url ? (
                    <div className="relative w-full h-40 bg-pink-100 rounded-lg overflow-hidden group">
                      <Image 
                        src={formData.thumbnail_url} 
                        alt="Thumbnail" 
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setFormData({...formData, thumbnail_url: ''})}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                        <label className="bg-white text-gray-700 p-2 rounded-full hover:bg-pink-50 transition cursor-pointer">
                          <Upload size={16} />
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-pink-300 transition cursor-pointer block bg-pink-50/50">
                      <Upload size={24} className="mx-auto text-pink-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload thumbnail</p>
                      <p className="text-xs text-gray-400">PNG, JPG (recommended: 1280x720)</p>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {formErrors.thumbnail_url && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.thumbnail_url}
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

              {/* YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                <input
                  type="url"
                  className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                    formErrors.youtube_url ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
                />
                {formErrors.youtube_url && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.youtube_url}
                  </p>
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
                  placeholder="Song title"
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
                  className="w-full p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                  rows={3}
                  placeholder="Short description about the video..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
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
                  onClick={saveVideo}
                  disabled={uploading}
                  className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50"
                >
                  {editingItem ? 'Update' : 'Add'} Video
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