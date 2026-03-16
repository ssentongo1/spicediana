'use client'

import Link from 'next/link'
import { 
  ArrowLeft,
  Heart, 
  MessageCircle,
  Send,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  UserPlus,
  Users,
  Calendar,
  MapPin,
  Music,
  Crown
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
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

interface FeedMedia {
  id: number
  media_url: string
  media_type: 'image' | 'video'
  position: number
}

interface Comment {
  id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  profiles: Profile
}

interface FeedPost {
  id: number
  caption: string | null
  likes_count: number
  created_at: string
  media: FeedMedia[]
  user_has_liked?: boolean
  profiles?: Profile
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState<{[key: number]: number}>({})
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [videoMuted, setVideoMuted] = useState<{[key: string]: boolean}>({})
  
  // Comments states
  const [comments, setComments] = useState<{[key: number]: Comment[]}>({})
  const [showComments, setShowComments] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Profile modal states
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profilePostsCount, setProfilePostsCount] = useState(0)
  const [profileLikesReceived, setProfileLikesReceived] = useState(0)

  useEffect(() => {
    fetchProfileImage()
    fetchPosts()
  }, [])

  // Listen for storage changes (when user logs in/out)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'team_user') {
        fetchPosts()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  async function fetchProfileImage() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('profile_image')
        .eq('id', 1)
        .single()

      if (data) {
        setProfileImage(data.profile_image)
      }
    } catch (error) {
      console.error('Error fetching profile image:', error)
    }
  }

  // FIXED: fetchPosts now loads likes AND comments automatically
  async function fetchPosts() {
    try {
      const { data: postsData } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })

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

      // Check for user INSIDE the function
      const userStr = localStorage.getItem('team_user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const postsWithLikesAndComments = await Promise.all(
          postsWithMedia.map(async (post) => {
            const [likeResult, commentsResult] = await Promise.all([
              supabase
                .from('feed_likes')
                .select('*')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .maybeSingle(),
              
              supabase
                .from('feed_comments')
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
                .eq('post_id', post.id)
                .order('created_at', { ascending: true })
            ])
            
            // Store comments in state
            if (commentsResult.data) {
              setComments(prev => ({ ...prev, [post.id]: commentsResult.data || [] }))
            }
            
            return {
              ...post,
              user_has_liked: !!likeResult.data
            }
          })
        )
        setPosts(postsWithLikesAndComments)
      } else {
        // Still fetch comments even when no user
        const postsWithComments = await Promise.all(
          postsWithMedia.map(async (post) => {
            const { data: commentsData } = await supabase
              .from('feed_comments')
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
              .eq('post_id', post.id)
              .order('created_at', { ascending: true })
            
            if (commentsData) {
              setComments(prev => ({ ...prev, [post.id]: commentsData }))
            }
            
            return post
          })
        )
        setPosts(postsWithComments)
      }
    } catch (error) {
      console.error('Error fetching feed posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments(postId: number) {
    try {
      const { data } = await supabase
        .from('feed_comments')
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
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      setComments(prev => ({ ...prev, [postId]: data || [] }))
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  async function viewProfile(profile: Profile) {
    setSelectedProfile(profile)
    
    // Get user's post count from community posts
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

    setProfilePostsCount(postsCount || 0)
    setProfileLikesReceived(totalLikes)
    setShowProfileModal(true)
  }

  // FIXED LIKE FUNCTION - Works perfectly and persists after refresh
  async function handleLike(postId: number) {
    const userStr = localStorage.getItem('team_user')
    if (!userStr) {
      alert('Please login to like posts')
      return
    }

    const user = JSON.parse(userStr)
    const post = posts.find(p => p.id === postId)
    if (!post) return

    // Optimistically update UI immediately
    const newLikedState = !post.user_has_liked
    const newLikeCount = newLikedState ? post.likes_count + 1 : post.likes_count - 1

    setPosts(prev => prev.map(p => 
      p.id === postId
        ? {
            ...p,
            user_has_liked: newLikedState,
            likes_count: newLikeCount
          }
        : p
    ))

    try {
      const { data: existingLike } = await supabase
        .from('feed_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingLike) {
        // Unlike - remove like record
        await supabase
          .from('feed_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        // Decrement the likes_count
        await supabase
          .from('feed_posts')
          .update({ likes_count: post.likes_count - 1 })
          .eq('id', postId)
      } else {
        // Like - add like record
        await supabase
          .from('feed_likes')
          .insert([{
            post_id: postId,
            user_id: user.id
          }])

        // Increment the likes_count
        await supabase
          .from('feed_posts')
          .update({ likes_count: post.likes_count + 1 })
          .eq('id', postId)
      }
    } catch (error) {
      // Revert on error
      setPosts(prev => prev.map(p => 
        p.id === postId
          ? {
              ...p,
              user_has_liked: post.user_has_liked,
              likes_count: post.likes_count
            }
          : p
      ))
      console.error('Error liking post:', error)
    }
  }

  async function handleAddComment(postId: number) {
    const userStr = localStorage.getItem('team_user')
    if (!userStr) {
      alert('Please login to comment')
      return
    }

    if (!newComment.trim()) return

    const user = JSON.parse(userStr)

    setSubmittingComment(true)
    try {
      const { error } = await supabase
        .from('feed_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        }])

      if (error) throw error

      setNewComment('')
      await fetchComments(postId)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  function toggleComments(postId: number) {
    if (showComments === postId) {
      setShowComments(null)
    } else {
      setShowComments(postId)
      // No need to fetch comments here anymore since they're already loaded
    }
  }

  function toggleVideoMute(postId: number, mediaId: number) {
    const key = `${postId}-${mediaId}`
    setVideoMuted(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // PREMIUM LOADING SPINNER
  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link 
            href="/" 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600 mr-4"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              Spice's Feed
            </h1>
            <p className="text-sm text-gray-500">All posts from Spice Diana</p>
          </div>
        </div>
      </header>

      {/* Feed Posts */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl border border-pink-100 overflow-hidden shadow-sm">
                {/* Post Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-full overflow-hidden flex-shrink-0">
                    {profileImage ? (
                      <Image src={profileImage} alt="Spice" width={40} height={40} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera size={18} className="text-pink-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-base">Spice Diana</span>
                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">✓</span>
                    </div>
                    <p className="text-sm text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Media Carousel */}
                {post.media && post.media.length > 0 && (
                  <div className="relative w-full bg-black">
                    <Swiper
                      modules={[Navigation, Pagination]}
                      navigation={{
                        prevEl: `.swiper-button-prev-${post.id}`,
                        nextEl: `.swiper-button-next-${post.id}`,
                      }}
                      pagination={{ clickable: true }}
                      spaceBetween={0}
                      slidesPerView={1}
                      onSlideChange={(swiper) => {
                        setActiveSlide(prev => ({ ...prev, [post.id]: swiper.activeIndex }))
                      }}
                      className="aspect-[1/2] md:aspect-auto md:h-[70vh]"
                    >
                      {post.media.map((media, index) => {
                        const muteKey = `${post.id}-${media.id}`
                        return (
                          <SwiperSlide key={media.id}>
                            {media.media_type === 'image' ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={media.media_url}
                                  alt={`${post.caption || 'Post'} - image ${index + 1}`}
                                  fill
                                  className="object-contain"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="relative w-full h-full group">
                                <video
                                  src={media.media_url}
                                  className="w-full h-full object-contain"
                                  muted={!videoMuted[muteKey]}
                                  loop
                                  autoPlay
                                  playsInline
                                />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    toggleVideoMute(post.id, media.id)
                                  }}
                                  className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/80 transition"
                                >
                                  {videoMuted[muteKey] ? (
                                    <Volume2 size={16} />
                                  ) : (
                                    <VolumeX size={16} />
                                  )}
                                </button>
                              </div>
                            )}
                          </SwiperSlide>
                        )
                      })}
                    </Swiper>

                    {post.media.length > 1 && (
                      <>
                        <button className={`swiper-button-prev-${post.id} absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition`}>
                          <ChevronLeft size={20} />
                        </button>
                        <button className={`swiper-button-next-${post.id} absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition`}>
                          <ChevronRight size={20} />
                        </button>
                        
                        <div className="absolute top-3 right-3 z-10 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                          {activeSlide[post.id] !== undefined ? activeSlide[post.id] + 1 : 1} / {post.media.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Post Actions */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 transition ${
                        post.user_has_liked 
                          ? 'text-pink-600' 
                          : 'text-gray-500 hover:text-pink-600'
                      }`}
                    >
                      <Heart size={20} fill={post.user_has_liked ? 'currentColor' : 'none'} />
                      <span className="text-sm font-medium">{post.likes_count}</span>
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition"
                    >
                      <MessageCircle size={20} />
                      <span className="text-sm font-medium">
                        {comments[post.id]?.length || 0}
                      </span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition ml-auto">
                      <Send size={20} />
                    </button>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <div className="text-sm mb-3">
                      <span className="font-semibold text-gray-800 mr-2">Spice Diana</span>
                      <span className="text-gray-600">{post.caption}</span>
                    </div>
                  )}

                  {/* Comments Section */}
                  {showComments === post.id && (
                    <div className="mt-4 pt-4 border-t border-pink-100">
                      {/* Comments List */}
                      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-2">
                            <button
                              onClick={() => viewProfile(comment.profiles)}
                              className="w-6 h-6 bg-pink-100 rounded-full overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-pink-300 transition"
                            >
                              {comment.profiles?.avatar_url ? (
                                <Image
                                  src={comment.profiles.avatar_url}
                                  alt={comment.profiles.username}
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Camera size={10} className="text-pink-600" />
                                </div>
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => viewProfile(comment.profiles)}
                                  className="font-medium text-gray-800 text-xs hover:text-pink-600 transition"
                                >
                                  {comment.profiles?.username}
                                </button>
                                {comment.profiles?.is_spice && (
                                  <div className="w-3 h-3 bg-[#1DA1F2] rounded-full flex items-center justify-center">
                                    <svg width="6" height="6" viewBox="0 0 24 24" fill="white">
                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                  </div>
                                )}
                                <span className="text-[9px] text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Comment */}
                      {(() => {
                        const userStr = typeof window !== 'undefined' ? localStorage.getItem('team_user') : null
                        const currentUser = userStr ? JSON.parse(userStr) : null
                        return currentUser ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 p-2 border border-pink-100 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(post.id)
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newComment.trim() || submittingComment}
                              className="px-4 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition disabled:opacity-50"
                            >
                              Post
                            </button>
                          </div>
                        ) : (
                          <div className="bg-pink-50 rounded-lg p-3 text-center">
                            <p className="text-xs text-gray-600 mb-2">Join Team Spice to comment</p>
                            <Link
                              href="/team"
                              className="inline-flex items-center gap-1 text-pink-600 text-xs font-medium hover:underline"
                            >
                              <UserPlus size={12} />
                              Sign up now
                            </Link>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-pink-100">
            <Camera size={48} className="mx-auto text-pink-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
            <p className="text-sm text-gray-500">Check back soon for new content from Spice</p>
          </div>
        )}
      </div>

      {/* Profile View Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">
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
              <div className="text-center">
                <div className="font-bold text-pink-600 text-lg">{profilePostsCount}</div>
                <div className="text-xs text-gray-500">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-pink-600 text-lg">{profileLikesReceived}</div>
                <div className="text-xs text-gray-500">Likes received</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}