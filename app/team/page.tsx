'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle,
  Send,
  Users,
  UserPlus,
  LogIn,
  X,
  Image as ImageIcon,
  Trash2,
  Crown
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Profile {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
  is_spice: boolean
}

interface Post {
  id: number
  user_id: number
  content: string | null
  image_url: string | null
  likes_count: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: Profile
  user_has_liked?: boolean
}

export default function TeamPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [postImage, setPostImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Auth form state
  const [authForm, setAuthForm] = useState({
    email: '',
    username: '',
    password: '',
    full_name: ''
  })

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            is_verified,
            is_spice
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Check if current user liked each post
      const userStr = localStorage.getItem('team_user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const postsWithLikes = await Promise.all(
          (data || []).map(async (post) => {
            const { data: like } = await supabase
              .from('post_likes')
              .select('*')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle()
            
            return {
              ...post,
              user_has_liked: !!like
            }
          })
        )
        setPosts(postsWithLikes)
      } else {
        setPosts(data || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    if (!file) return null

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `post_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `community/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('music')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error: any) {
      alert('Image upload failed: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadImage(file)
    if (url) {
      setPostImage(url)
    }
  }

  async function handleSignUp() {
    if (!authForm.email || !authForm.username || !authForm.password) {
      alert('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{
          username: authForm.username,
          email: authForm.email,
          full_name: authForm.full_name || null,
          is_verified: false,
          is_spice: false
        }])

      if (error) throw error

      alert('Account created! You can now log in.')
      setShowAuth(false)
      setIsLogin(true)
      setAuthForm({ email: '', username: '', password: '', full_name: '' })
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogin() {
    if (!authForm.email || !authForm.password) {
      alert('Please enter email and password')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', authForm.email)
        .single()

      if (error || !data) {
        alert('Invalid email or password')
        return
      }

      localStorage.setItem('team_user', JSON.stringify(data))
      
      alert('Logged in successfully!')
      setShowAuth(false)
      setAuthForm({ email: '', username: '', password: '', full_name: '' })
      fetchPosts() // Refresh posts to show like status
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreatePost() {
    const userStr = localStorage.getItem('team_user')
    if (!userStr) {
      alert('Please login to post')
      setShowAuth(true)
      return
    }

    if (!newPost.trim() && !postImage) {
      alert('Please write something or add an image')
      return
    }

    const user = JSON.parse(userStr)

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: user.id,
          content: newPost.trim() || null,
          image_url: postImage,
          status: 'pending'
        }])

      if (error) throw error

      setNewPost('')
      setPostImage(null)
      alert('Post submitted for approval!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLike(postId: number) {
    const userStr = localStorage.getItem('team_user')
    if (!userStr) {
      alert('Please login to like posts')
      setShowAuth(true)
      return
    }

    const user = JSON.parse(userStr)

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingLike) {
        // Unlike - delete the like
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        // Get current post to know likes count
        const { data: post } = await supabase
          .from('community_posts')
          .select('likes_count')
          .eq('id', postId)
          .single()

        // Update with new count
        await supabase
          .from('community_posts')
          .update({ likes_count: (post?.likes_count || 1) - 1 })
          .eq('id', postId)
      } else {
        // Like - create like
        await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: user.id
          }])

        // Get current post to know likes count
        const { data: post } = await supabase
          .from('community_posts')
          .select('likes_count')
          .eq('id', postId)
          .single()

        // Update with new count
        await supabase
          .from('community_posts')
          .update({ likes_count: (post?.likes_count || 0) + 1 })
          .eq('id', postId)
      }

      // Refresh posts to show updated likes
      fetchPosts()
    } catch (error) {
      console.error('Error liking post:', error)
      alert('Failed to like post. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('team_user') : null
  const currentUser = userStr ? JSON.parse(userStr) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                Team Spice
              </h1>
              <p className="text-sm text-gray-500">Connect with fellow fans</p>
            </div>
          </div>

          {/* Auth Buttons */}
          {!currentUser ? (
            <button
              onClick={() => setShowAuth(true)}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition flex items-center gap-2"
            >
              <LogIn size={16} />
              Join Team
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">@{currentUser.username}</span>
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center overflow-hidden">
                {currentUser.avatar_url ? (
                  <Image src={currentUser.avatar_url} alt={currentUser.username} width={32} height={32} className="object-cover" />
                ) : (
                  <Users size={14} className="text-pink-600" />
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Create Post Box */}
      {currentUser && !currentUser.is_spice && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
            <textarea
              placeholder="Share something with the team..."
              className="w-full p-3 border border-pink-100 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-pink-300 placeholder-gray-400"
              rows={2}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />

            {/* Image Preview */}
            {postImage && (
              <div className="relative mt-3">
                <div className="relative h-32 bg-pink-100 rounded-lg overflow-hidden">
                  <Image 
                    src={postImage} 
                    alt="Post preview" 
                    fill 
                    className="object-cover"
                    loading="eager"
                  />
                </div>
                <button
                  onClick={() => setPostImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {/* Image Upload Button */}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition">
                    <ImageIcon size={18} />
                    <span className="text-sm">Photo</span>
                  </div>
                </label>
                {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
              </div>

              <button
                onClick={handleCreatePost}
                disabled={submitting || uploading}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition flex items-center gap-2"
              >
                <Send size={14} />
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spice's Special Post Box - Only visible to Spice */}
      {currentUser?.is_spice && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-yellow-50 to-pink-50 rounded-xl p-4 shadow-md border-2 border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#1DA1F2] rounded-full flex items-center justify-center">
                <Crown size={16} className="text-white" />
              </div>
              <span className="font-semibold text-gray-800">Post as Spice Diana ✨</span>
            </div>
            <textarea
              placeholder="Share something with your fans..."
              className="w-full p-3 border border-yellow-200 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-yellow-400 placeholder-gray-400"
              rows={2}
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />

            {/* Image Preview */}
            {postImage && (
              <div className="relative mt-3">
                <div className="relative h-32 bg-pink-100 rounded-lg overflow-hidden">
                  <Image 
                    src={postImage} 
                    alt="Post preview" 
                    fill 
                    className="object-cover"
                    loading="eager"
                  />
                </div>
                <button
                  onClick={() => setPostImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition">
                    <ImageIcon size={18} />
                    <span className="text-sm">Photo</span>
                  </div>
                </label>
                {uploading && <span className="text-xs text-gray-400">Uploading...</span>}
              </div>

              <button
                onClick={handleCreatePost}
                disabled={submitting || uploading}
                className="bg-gradient-to-r from-[#1DA1F2] to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition flex items-center gap-2"
              >
                <Crown size={14} />
                Post to Community
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto px-4">
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div key={post.id} className={`bg-white rounded-xl p-4 shadow-sm border ${
                post.profiles?.is_spice ? 'border-yellow-200 bg-gradient-to-r from-yellow-50/30 to-white' : 'border-pink-100'
              }`}>
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center overflow-hidden">
                    {post.profiles?.avatar_url ? (
                      <Image 
                        src={post.profiles.avatar_url} 
                        alt={post.profiles.username} 
                        width={40} 
                        height={40} 
                        className="object-cover"
                        loading="eager"
                        priority={index < 2}
                      />
                    ) : (
                      <Users size={18} className="text-pink-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-800">
                        {post.profiles?.full_name || post.profiles?.username}
                      </span>
                      {post.profiles?.is_spice && (
                        <div className="flex items-center justify-center w-5 h-5 bg-[#1DA1F2] rounded-full ml-1 shadow-sm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                          </svg>
                        </div>
                      )}
                      {post.profiles?.is_verified && !post.profiles?.is_spice && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      @{post.profiles?.username} · {new Date(post.created_at).toLocaleDateString()}
                      {post.profiles?.is_spice && (
                        <span className="ml-2 text-[#1DA1F2] text-xs font-medium">Official Account</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Post Content */}
                {post.content && (
                  <p className="text-gray-800 text-sm mb-3">{post.content}</p>
                )}

                {/* Post Image */}
                {post.image_url && (
                  <div className="relative h-48 md:h-64 bg-pink-100 rounded-lg mb-3 overflow-hidden">
                    <Image 
                      src={post.image_url} 
                      alt="Post" 
                      fill 
                      className="object-cover"
                      loading="eager"
                      priority={index < 2}
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-pink-100">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 transition ${
                      post.user_has_liked 
                        ? 'text-pink-600' 
                        : 'text-gray-500 hover:text-pink-600'
                    }`}
                  >
                    <Heart size={16} fill={post.user_has_liked ? 'currentColor' : 'none'} />
                    <span className="text-sm">{post.likes_count}</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition">
                    <MessageCircle size={16} />
                    <span className="text-sm">0</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-pink-100">
            <Users size={40} className="mx-auto text-pink-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
            <p className="text-sm text-gray-500 mb-4">Be the first to share something!</p>
            {!currentUser && (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
              >
                <UserPlus size={16} />
                Join Team Spice
              </button>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 relative">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {isLogin ? 'Login' : 'Join Team Spice'}
            </h2>

            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name (optional)"
                className="w-full p-3 border border-pink-100 rounded-lg mb-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                value={authForm.full_name}
                onChange={(e) => setAuthForm({...authForm, full_name: e.target.value})}
              />
            )}

            {!isLogin && (
              <input
                type="text"
                placeholder="Username"
                className="w-full p-3 border border-pink-100 rounded-lg mb-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-pink-100 rounded-lg mb-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
              value={authForm.email}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border border-pink-100 rounded-lg mb-4 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
              value={authForm.password}
              onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            />

            <button
              onClick={isLogin ? handleLogin : handleSignUp}
              disabled={submitting}
              className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition mb-3"
            >
              {submitting ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            </button>

            <p className="text-sm text-center text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-pink-600 font-medium hover:underline"
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>

            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-pink-50 flex items-center justify-center"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}