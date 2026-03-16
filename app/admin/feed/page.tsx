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
  Heart,
  X,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface FeedPost {
  id: number
  caption: string | null
  likes_count: number
  created_at: string
  media?: FeedMedia[]
}

interface FeedMedia {
  id: number
  post_id: number
  media_url: string
  media_type: 'image' | 'video'
  position: number
}

export default function AdminFeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<FeedPost | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // Form state
  const [formData, setFormData] = useState({
    caption: '',
    media: [] as { url: string; type: 'image' | 'video'; file?: File }[]
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Fetch media for each post
      const postsWithMedia = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: mediaData } = await supabase
            .from('feed_media')
            .select('*')
            .eq('post_id', post.id)
            .order('position', { ascending: true })

          return {
            ...post,
            media: mediaData || []
          }
        })
      )

      setPosts(postsWithMedia)
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
      const fileName = `feed_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `feed/${fileName}`

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
    const files = e.target.files
    if (!files || files.length === 0) return

    const newMedia = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const url = await uploadFile(file)
      if (url) {
        newMedia.push({
          url,
          type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
          file
        })
      }
    }

    setFormData({
      ...formData,
      media: [...formData.media, ...newMedia]
    })
  }

  function removeMedia(index: number) {
    const newMedia = [...formData.media]
    newMedia.splice(index, 1)
    setFormData({ ...formData, media: newMedia })
  }

  function moveMediaUp(index: number) {
    if (index === 0) return
    const newMedia = [...formData.media]
    const temp = newMedia[index]
    newMedia[index] = newMedia[index - 1]
    newMedia[index - 1] = temp
    setFormData({ ...formData, media: newMedia })
  }

  function moveMediaDown(index: number) {
    if (index === formData.media.length - 1) return
    const newMedia = [...formData.media]
    const temp = newMedia[index]
    newMedia[index] = newMedia[index + 1]
    newMedia[index + 1] = temp
    setFormData({ ...formData, media: newMedia })
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (formData.media.length === 0) errors.media = 'Add at least one image or video'
    if (!formData.caption?.trim()) errors.caption = 'Caption is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function savePost() {
    if (!validateForm()) return

    try {
      let postId: number

      if (editingItem) {
        // Update existing post
        const { error: updateError } = await supabase
          .from('feed_posts')
          .update({ caption: formData.caption })
          .eq('id', editingItem.id)

        if (updateError) throw updateError
        postId = editingItem.id

        // Delete existing media
        await supabase
          .from('feed_media')
          .delete()
          .eq('post_id', editingItem.id)
      } else {
        // Create new post
        const { data: newPost, error: insertError } = await supabase
          .from('feed_posts')
          .insert([{ 
            caption: formData.caption,
            likes_count: 0 
          }])
          .select()

        if (insertError) throw insertError
        postId = newPost[0].id
      }

      // Insert new media
      const mediaToInsert = formData.media.map((item, index) => ({
        post_id: postId,
        media_url: item.url,
        media_type: item.type,
        position: index
      }))

      const { error: mediaError } = await supabase
        .from('feed_media')
        .insert(mediaToInsert)

      if (mediaError) throw mediaError

      setShowForm(false)
      resetForm()
      fetchPosts()
      alert(editingItem ? 'Post updated!' : 'Post added!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deletePost(id: number) {
    if (!confirm('Delete this post?')) return

    try {
      const { error } = await supabase
        .from('feed_posts')
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
      caption: '',
      media: []
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editPost(post: FeedPost) {
    setFormData({
      caption: post.caption || '',
      media: post.media?.map(m => ({ url: m.media_url, type: m.media_type })) || []
    })
    setEditingItem(post)
    setShowForm(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                Feed Manager
              </h1>
              <p className="text-sm text-gray-500">Create posts with multiple images/videos</p>
            </div>
          </div>
          <button 
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-200 transition-all duration-300 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>New Post</span>
          </button>
        </div>
      </header>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Media Preview (first image) */}
                <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-pink-50">
                  {post.media && post.media.length > 0 ? (
                    post.media[0].media_type === 'image' ? (
                      <Image 
                        src={post.media[0].media_url} 
                        alt={post.caption || 'Feed post'} 
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <video 
                        src={post.media[0].media_url} 
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} className="text-pink-300" />
                    </div>
                  )}
                  
                  {/* Media count badge */}
                  {post.media && post.media.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                      {post.media.length} items
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-gray-800 text-sm mb-3 line-clamp-2">{post.caption}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-pink-600">
                      <Heart size={16} />
                      <span className="text-sm">{post.likes_count}</span>
                    </div>
                    
                    <div className="flex gap-2">
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-pink-100">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-6">Create your first Instagram-style post</p>
            <button 
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Post
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                  {editingItem ? 'Edit' : 'Create New'} Post
                </h2>
                <button 
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="w-10 h-10 rounded-full hover:bg-pink-50 flex items-center justify-center transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Media Upload - Multiple files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images/Videos (up to 10)
                </label>
                <div className="relative">
                  <label className="border-3 border-dashed border-pink-200 rounded-2xl p-8 text-center hover:border-pink-300 transition cursor-pointer block bg-pink-50/50">
                    <Upload size={40} className="mx-auto text-pink-300 mb-3" />
                    <p className="text-gray-600 font-medium mb-1">Click to select multiple files</p>
                    <p className="text-sm text-gray-400">PNG, JPG, MP4 up to 20MB each</p>
                    <input 
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                {formErrors.media && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.media}
                  </p>
                )}
                {uploading && (
                  <div className="mt-3">
                    <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300"
                        style={{width: `${uploadProgress}%`}}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Media Preview with sorting */}
              {formData.media.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Media Preview (drag to reorder)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.media.map((item, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square bg-pink-100 rounded-lg overflow-hidden">
                          {item.type === 'image' ? (
                            <Image
                              src={item.url}
                              alt={`Media ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <video
                              src={item.url}
                              className="w-full h-full object-cover"
                            />
                          )}
                          
                          {/* Media type indicator */}
                          {item.type === 'video' && (
                            <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded-full">
                              <Film size={12} />
                            </div>
                          )}

                          {/* Position number */}
                          <div className="absolute top-2 right-2 bg-black/50 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </div>

                          {/* Hover controls */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => moveMediaUp(index)}
                              className="bg-white text-gray-700 p-1.5 rounded-full hover:bg-pink-50 transition"
                              disabled={index === 0}
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <button
                              onClick={() => removeMedia(index)}
                              className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => moveMediaDown(index)}
                              className="bg-white text-gray-700 p-1.5 rounded-full hover:bg-pink-50 transition"
                              disabled={index === formData.media.length - 1}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <textarea
                  className={`w-full p-4 border-2 rounded-xl text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 ${
                    formErrors.caption ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  rows={3}
                  placeholder="Write a caption..."
                  value={formData.caption}
                  onChange={(e) => setFormData({...formData, caption: e.target.value})}
                />
                {formErrors.caption && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.caption}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-pink-100">
                <button 
                  onClick={savePost}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      {editingItem ? 'Update Post' : 'Publish Post'}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="flex-1 border-2 border-pink-200 text-gray-700 py-3.5 rounded-xl font-medium hover:bg-pink-50 transition-all"
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