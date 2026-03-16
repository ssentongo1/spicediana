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
  Crown,
  Camera,
  Calendar,
  MapPin,
  Music,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/LoadingSpinner'

// Types
interface Profile {
  id: number
  username: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  location: string | null
  favorite_song: string | null
  is_verified: boolean
  is_spice: boolean
  created_at: string
  joined_date: string
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
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showUserPosts, setShowUserPosts] = useState(false)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [userPostsCount, setUserPostsCount] = useState(0)
  const [userLikesReceived, setUserLikesReceived] = useState(0)
  const [loadingUserPosts, setLoadingUserPosts] = useState(false)

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
            bio,
            location,
            favorite_song,
            is_verified,
            is_spice,
            created_at,
            joined_date
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

  async function fetchUserPosts(userId: number) {
    setLoadingUserPosts(true)
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
            bio,
            location,
            favorite_song,
            is_verified,
            is_spice,
            created_at,
            joined_date
          )
        `)
        .eq('user_id', userId)
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
        setUserPosts(postsWithLikes)
      } else {
        setUserPosts(data || [])
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
    } finally {
      setLoadingUserPosts(false)
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
    if (!authForm.email || !authForm.username || !authForm.password || !authForm.full_name) {
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
          full_name: authForm.full_name,
          is_verified: false,
          is_spice: false,
          joined_date: new Date()
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
      fetchPosts()
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
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingLike) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        await supabase
          .from('community_posts')
          .update({ likes_count: supabase.rpc('decrement', { x: 1 }) })
          .eq('id', postId)
      } else {
        await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: user.id
          }])

        await supabase
          .from('community_posts')
          .update({ likes_count: supabase.rpc('increment', { x: 1 }) })
          .eq('id', postId)
      }

      fetchPosts()
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  async function viewProfile(profile: Profile) {
    setSelectedProfile(profile)
    
    // Get user's post count
    const { count: postsCount } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('status', 'approved')
    
    // Get total likes received
    const { data: posts } = await supabase
      .from('community_posts')
      .select('likes_count')
      .eq('user_id', profile.id)
      .eq('status', 'approved')
    
    const totalLikes = posts?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0

    setUserPostsCount(postsCount || 0)
    setUserLikesReceived(totalLikes)
    setShowProfileModal(true)
    setShowUserPosts(false)
  }

  async function viewUserPosts(profile: Profile) {
    setSelectedProfile(profile)
    await fetchUserPosts(profile.id)
    setShowUserPosts(true)
    setShowProfileModal(false)
  }

  function backToProfile() {
    setShowUserPosts(false)
    setShowProfileModal(true)
  }

  // PREMIUM LOADING SPINNER
  if (loading) {
    return <LoadingSpinner />
  }

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('team_user') : null
  const currentUser = userStr ? JSON.parse(userStr) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-3 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto">
          {/* Top Row - Back button and title */}
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/" 
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600 flex-shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent truncate">
                Team Spice
              </h1>
              <p className="text-xs text-gray-500 truncate">Connect with fellow fans</p>
            </div>

            {/* Auth Buttons - for non-logged in users */}
            {!currentUser && (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-pink-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-pink-700 transition flex items-center gap-1.5 flex-shrink-0"
              >
                <LogIn size={14} />
                <span>Join</span>
              </button>
            )}
          </div>

          {/* User Info Row - Only when logged in */}
          {currentUser && (
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-pink-100">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={() => viewProfile(currentUser)}
                  className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-pink-300 transition flex-shrink-0"
                >
                  {currentUser.avatar_url ? (
                    <Image src={currentUser.avatar_url} alt={currentUser.username} width={32} height={32} className="object-cover" />
                  ) : (
                    <Users size={14} className="text-pink-600" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-gray-800 text-sm truncate">
                      {currentUser.full_name || currentUser.username}
                    </span>
                    {currentUser.is_spice && (
                      <div className="flex items-center justify-center w-4 h-4 bg-[#1DA1F2] rounded-full flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">@{currentUser.username}</p>
                </div>
              </div>
              
              <Link
                href="/team/profile/edit"
                className="text-xs text-pink-600 hover:underline px-2 py-1 flex-shrink-0"
              >
                Edit
              </Link>
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

      {/* Spice's Special Post Box */}
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
                {/* Post Header - Make avatar clickable */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => viewProfile(post.profiles)}
                    className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-pink-300 transition cursor-pointer flex-shrink-0"
                  >
                    {post.profiles?.avatar_url ? (
                      <Image 
                        src={post.profiles.avatar_url} 
                        alt={post.profiles.username} 
                        width={40} 
                        height={40} 
                        className="object-cover"
                      />
                    ) : (
                      <Users size={18} className="text-pink-600" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => viewProfile(post.profiles)}
                        className="font-semibold text-gray-800 hover:text-pink-600 transition text-left truncate text-sm"
                      >
                        {post.profiles?.full_name || post.profiles?.username}
                      </button>
                      {post.profiles?.is_spice && (
                        <div className="flex items-center justify-center w-5 h-5 bg-[#1DA1F2] rounded-full ml-1 shadow-sm flex-shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                          </svg>
                        </div>
                      )}
                      {post.profiles?.is_verified && !post.profiles?.is_spice && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
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
                      loading="lazy"
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
            <Users size={40} className="mx-auto text-pink-300 mb-4" />
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

      {/* Profile View Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-pink-50 flex items-center justify-center"
            >
              <X size={16} className="text-gray-500" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-pink-200 border-4 border-pink-100 mb-3">
                {selectedProfile.avatar_url ? (
                  <Image
                    src={selectedProfile.avatar_url}
                    alt={selectedProfile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera size={32} className="text-pink-400" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">{selectedProfile.full_name}</h2>
              <p className="text-sm text-gray-500">@{selectedProfile.username}</p>
              {selectedProfile.is_spice && (
                <div className="flex items-center gap-1 mt-2 bg-[#1DA1F2] text-white px-3 py-1 rounded-full text-xs">
                  <Crown size={12} />
                  <span>Official Account</span>
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="space-y-3 mb-6">
              {selectedProfile.bio && (
                <p className="text-sm text-gray-600">{selectedProfile.bio}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} />
                <span>Joined {new Date(selectedProfile.joined_date || selectedProfile.created_at).toLocaleDateString()}</span>
              </div>

              {selectedProfile.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} />
                  <span>{selectedProfile.location}</span>
                </div>
              )}

              {selectedProfile.favorite_song && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Music size={14} />
                  <span>Favorite: {selectedProfile.favorite_song}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-pink-100">
              <button
                onClick={() => viewUserPosts(selectedProfile)}
                className="text-center hover:bg-pink-50 p-2 rounded-lg transition group"
              >
                <div className="font-bold text-pink-600 text-lg group-hover:scale-110 transition">{userPostsCount}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </button>
              <div className="text-center">
                <div className="font-bold text-pink-600 text-lg">{userLikesReceived}</div>
                <div className="text-xs text-gray-500">Likes received</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Posts Modal */}
      {showUserPosts && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Header with back button */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-4 -m-6 mb-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={backToProfile}
                  className="w-8 h-8 rounded-full hover:bg-pink-50 flex items-center justify-center"
                >
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-pink-100">
                    {selectedProfile.avatar_url ? (
                      <Image
                        src={selectedProfile.avatar_url}
                        alt={selectedProfile.username}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users size={14} className="text-pink-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">{selectedProfile.full_name}'s Posts</h2>
                    <p className="text-xs text-gray-400">@{selectedProfile.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserPosts(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-pink-50 flex items-center justify-center"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4 mt-4">
              {loadingUserPosts ? (
                <div className="text-center py-8">
                  <Loader2 size={32} className="animate-spin text-pink-600 mx-auto" />
                </div>
              ) : userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <div key={post.id} className="bg-pink-50/50 rounded-lg p-4">
                    {post.content && (
                      <p className="text-gray-800 text-sm mb-2">{post.content}</p>
                    )}
                    {post.image_url && (
                      <div className="relative h-40 bg-pink-100 rounded-lg mb-2 overflow-hidden">
                        <Image
                          src={post.image_url}
                          alt="Post"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} className="text-pink-400" />
                        {post.likes_count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No posts yet</p>
              )}
            </div>
          </div>
        </div>
      )}

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
                placeholder="Full Name *"
                className="w-full p-3 border border-pink-100 rounded-lg mb-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                value={authForm.full_name}
                onChange={(e) => setAuthForm({...authForm, full_name: e.target.value})}
              />
            )}

            {!isLogin && (
              <input
                type="text"
                placeholder="Username *"
                className="w-full p-3 border border-pink-100 rounded-lg mb-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
              />
            )}

            <input
              type="email"
              placeholder="Email *"
              className="w-full p-3 border border-pink-100 rounded-lg mb-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
              value={authForm.email}
              onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            />

            <input
              type="password"
              placeholder="Password *"
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