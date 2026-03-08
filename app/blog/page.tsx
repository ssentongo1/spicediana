'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Newspaper,
  Calendar,
  Clock,
  X,
  Heart,
  Share2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

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
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error: any) {
      console.error('Error fetching posts:', error.message)
    } finally {
      setLoading(false)
    }
  }

  function openPostModal(post: BlogPost) {
    setSelectedPost(post)
    setShowModal(true)
  }

  // Featured post is the most recent one
  const featuredPost = posts[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
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

      {/* Featured Post - Mobile Optimized */}
      {featuredPost && (
        <div 
          onClick={() => openPostModal(featuredPost)}
          className="max-w-7xl mx-auto px-4 py-6 cursor-pointer"
        >
          <div className="relative h-64 md:h-96 rounded-2xl md:rounded-3xl overflow-hidden group">
            {/* Background Image */}
            {featuredPost.image_url ? (
              <Image
                src={featuredPost.image_url}
                alt={featuredPost.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                <Newspaper size={48} className="text-white/50" />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
                <span className="bg-pink-600 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium mb-2 md:mb-3 inline-block">
                  Latest Story
                </span>
                <h2 className="text-xl md:text-4xl font-bold mb-2 md:mb-3 line-clamp-2">{featuredPost.title}</h2>
                <p className="text-white/80 mb-3 md:mb-4 max-w-2xl text-sm md:text-base line-clamp-2">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="md:w-4 md:h-4" />
                    {featuredPost.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="md:w-4 md:h-4" />
                    {featuredPost.read_time}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-4">
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {posts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => openPostModal(post)}
                className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-40 md:h-48 bg-gradient-to-br from-pink-100 to-pink-50 overflow-hidden">
                  {post.image_url ? (
                    <Image 
                      src={post.image_url} 
                      alt={post.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={32} className="text-pink-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={10} className="md:w-3 md:h-3" />
                      <span className="hidden sm:inline">{post.date}</span>
                      <span className="sm:hidden">{post.date.split(' ')[0]}</span>
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} className="md:w-3 md:h-3" />
                      {post.read_time.replace('min read', 'm')}
                    </span>
                  </div>

                  <h3 className="text-base md:text-xl font-bold text-gray-800 mb-1 md:mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">{post.excerpt}</p>

                  <div className="flex items-center text-pink-600 font-medium text-sm md:text-base group-hover:gap-2 transition-all">
                    Read More →
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-pink-100">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Newspaper size={24} className="md:w-8 md:h-8 text-pink-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No posts yet</h3>
            <p className="text-sm md:text-base text-gray-500">Check back soon for new stories</p>
          </div>
        )}
      </div>

      {/* Newsletter Signup - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-xl p-4 md:p-6 text-white shadow-md">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart size={16} className="md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold">Never Miss a Story</h3>
                <p className="text-xs md:text-sm text-pink-100">Get updates straight to your inbox</p>
              </div>
            </div>
            
            {/* Form - Stack on mobile, row on desktop */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="flex-1 px-3 md:px-4 py-2.5 md:py-2 rounded-lg text-gray-800 text-sm focus:outline-none"
              />
              <button className="w-full sm:w-auto bg-white text-pink-600 px-4 md:px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium hover:bg-pink-50 transition whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post Details Modal - Mobile Optimized */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl md:rounded-3xl shadow-2xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Sticky */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-3 md:p-6 rounded-t-xl md:rounded-t-3xl">
              <div className="flex items-start gap-2 md:gap-4">
                {/* Small image for mobile */}
                <div className="relative w-12 h-12 md:w-16 md:h-16 bg-pink-100 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0">
                  {selectedPost.image_url ? (
                    <Image 
                      src={selectedPost.image_url} 
                      alt={selectedPost.title} 
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper size={20} className="md:w-6 md:h-6 text-pink-400" />
                    </div>
                  )}
                </div>
                
                {/* Title and meta */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base md:text-2xl font-bold text-gray-800 line-clamp-2 pr-8">{selectedPost.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                      {selectedPost.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={10} className="md:w-3 md:h-3" />
                      <span className="hidden xs:inline">{selectedPost.date}</span>
                      <span className="xs:hidden">{selectedPost.date.split(' ')[0]}</span>
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} className="md:w-3 md:h-3" />
                      {selectedPost.read_time.replace('min read', 'm')}
                    </span>
                  </div>
                </div>

                {/* Close button */}
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-3 right-3 md:static w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-pink-50 flex items-center justify-center transition flex-shrink-0"
                >
                  <X size={16} className="md:w-5 md:h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 md:p-6">
              {/* Featured Image */}
              {selectedPost.image_url && (
                <div className="relative h-48 md:h-80 rounded-lg md:rounded-2xl overflow-hidden mb-4 md:mb-6">
                  <Image
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose max-w-none">
                <p className="text-sm md:text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedPost.content}
                </p>
              </div>

              {/* Share Actions */}
              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-pink-100 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <button className="flex items-center gap-1 md:gap-2 text-gray-500 hover:text-pink-600 transition">
                    <Heart size={16} className="md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm">Like</span>
                  </button>
                  <button className="flex items-center gap-1 md:gap-2 text-gray-500 hover:text-pink-600 transition">
                    <Share2 size={16} className="md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm">Share</span>
                  </button>
                </div>
                <span className="text-xs md:text-sm text-gray-400">Spice Diana Official</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}