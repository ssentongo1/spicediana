'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Newspaper,
  Calendar,
  Clock,
  X,
  Heart
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/LoadingSpinner'

// Types
interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  category: string
  date: string
  read_time: string
  image_url: string | null
  created_at: string
  likes_count?: number
  user_has_liked?: boolean
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Initialize with 0 likes (no fake numbers)
      const postsWithLikes = (data || []).map(post => ({
        ...post,
        likes_count: 0,
        user_has_liked: false
      }))

      setPosts(postsWithLikes)
    } catch (error: any) {
      console.error('Error fetching posts:', error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleLike(postId: number) {
    setPosts(prev => prev.map(post => 
      post.id === postId
        ? {
            ...post,
            user_has_liked: !post.user_has_liked,
            likes_count: post.user_has_liked 
              ? (post.likes_count || 1) - 1 
              : (post.likes_count || 0) + 1
          }
        : post
    ))

    // Here you would also update the database
    // For now, it's just UI state
  }

  function openPostModal(post: BlogPost) {
    setSelectedPost(post)
    setShowModal(true)
  }

  // Featured post is the most recent one
  const featuredPost = posts[0]

  // PREMIUM LOADING SPINNER
  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link 
            href="/" 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600 mr-4"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              The Spice Diary
            </h1>
            <p className="text-sm text-gray-500">Stories, updates, and behind the scenes</p>
          </div>
        </div>
      </header>

      {/* Featured Post */}
      {featuredPost && (
        <div 
          onClick={() => openPostModal(featuredPost)}
          className="max-w-7xl mx-auto px-4 py-6 cursor-pointer"
        >
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden group">
            {/* Background Image */}
            {featuredPost.image_url ? (
              <Image
                src={featuredPost.image_url}
                alt={featuredPost.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                <Newspaper size={48} className="text-white/50" />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
                <span className="bg-pink-600 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium mb-2 inline-block">
                  Latest Story
                </span>
                <h2 className="text-xl md:text-4xl font-bold mb-2 line-clamp-2">{featuredPost.title}</h2>
                <p className="text-white/80 mb-3 max-w-2xl text-sm md:text-base line-clamp-2">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-3 text-xs md:text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {featuredPost.read_time}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer"
              >
                {/* Image */}
                <div 
                  onClick={() => openPostModal(post)}
                  className="relative h-40 md:h-48 bg-gradient-to-br from-pink-100 to-pink-50 overflow-hidden"
                >
                  {post.image_url ? (
                    <Image 
                      src={post.image_url} 
                      alt={post.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={32} className="text-pink-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 md:p-5">
                  <div 
                    onClick={() => openPostModal(post)}
                    className="flex flex-wrap items-center gap-2 mb-2"
                  >
                    <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {post.date}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {post.read_time}
                    </span>
                  </div>

                  <h3 
                    onClick={() => openPostModal(post)}
                    className="text-base md:text-lg font-bold text-gray-800 mb-2 line-clamp-2"
                  >
                    {post.title}
                  </h3>
                  <p 
                    onClick={() => openPostModal(post)}
                    className="text-sm text-gray-600 mb-3 line-clamp-3"
                  >
                    {post.excerpt}
                  </p>

                  {/* Like Button */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLike(post.id)
                      }}
                      className={`flex items-center gap-1 transition ${
                        post.user_has_liked 
                          ? 'text-pink-600' 
                          : 'text-gray-500 hover:text-pink-600'
                      }`}
                    >
                      <Heart size={16} fill={post.user_has_liked ? 'currentColor' : 'none'} />
                      <span className="text-xs font-medium">{post.likes_count}</span>
                    </button>
                    
                    <div 
                      onClick={() => openPostModal(post)}
                      className="flex items-center text-pink-600 font-medium text-sm group-hover:gap-2 transition-all"
                    >
                      Read More →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-pink-100">
            <Newspaper size={40} className="mx-auto text-pink-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
            <p className="text-sm text-gray-500">Check back soon for new stories</p>
          </div>
        )}
      </div>

      {/* Newsletter Signup */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-xl p-5 text-white shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Heart size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Never Miss a Story</h3>
                <p className="text-xs text-pink-100">Get updates straight to your inbox</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded-lg text-gray-800 text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button className="w-full sm:w-auto bg-white text-pink-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-pink-50 transition whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Details Modal */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-4 rounded-t-xl">
              <div className="flex items-start gap-3">
                <div className="relative w-12 h-12 md:w-14 md:h-14 bg-pink-100 rounded-lg overflow-hidden flex-shrink-0">
                  {selectedPost.image_url ? (
                    <Image 
                      src={selectedPost.image_url} 
                      alt={selectedPost.title} 
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={20} className="text-pink-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800 line-clamp-2">{selectedPost.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                      {selectedPost.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {selectedPost.date}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {selectedPost.read_time}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-pink-50 flex items-center justify-center"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Featured Image */}
              {selectedPost.image_url && (
                <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose max-w-none mb-4">
                <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedPost.content}
                </p>
              </div>

              {/* Like Button */}
              <div className="flex items-center gap-4 pt-4 border-t border-pink-100">
                <button
                  onClick={() => {
                    handleLike(selectedPost.id)
                    setSelectedPost(prev => prev ? {
                      ...prev,
                      user_has_liked: !prev.user_has_liked,
                      likes_count: prev.user_has_liked 
                        ? (prev.likes_count || 1) - 1 
                        : (prev.likes_count || 0) + 1
                    } : null)
                  }}
                  className={`flex items-center gap-2 transition ${
                    selectedPost.user_has_liked 
                      ? 'text-pink-600' 
                      : 'text-gray-500 hover:text-pink-600'
                  }`}
                >
                  <Heart size={20} fill={selectedPost.user_has_liked ? 'currentColor' : 'none'} />
                  <span className="text-sm font-medium">{selectedPost.likes_count}</span>
                </button>
                <span className="text-xs text-gray-400">Spice Diana Official</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}