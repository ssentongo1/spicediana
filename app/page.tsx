'use client'

import Link from 'next/link'
import { 
  Home, 
  Music, 
  ShoppingBag, 
  Calendar, 
  Users, 
  Newspaper, 
  Briefcase, 
  Info, 
  Mic2,
  Play,
  ChevronRight,
  Heart,
  Clock,
  Star
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface FeaturedPost {
  id: number
  position: number
  page_type: 'music' | 'shop' | 'events' | 'blog' | 'official' | 'brands'
  item_id: number
  item_data: {
    id: number
    title: string
    image_url?: string | null
    description?: string
    price_usd?: number
    date?: string
  }
}

interface Update {
  id: number
  type: 'music' | 'events' | 'shop' | 'blog' | 'official' | 'brands'
  title: string
  description: string
  time: string
  icon: any
  color: string
}

export default function HomePage() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('Spice Diana')
  const [profileTagline, setProfileTagline] = useState('The People\'s Princess')
  const [featured, setFeatured] = useState<FeaturedPost[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)

  // Icons and colors for each page type
  const pageConfig = {
    music: { icon: Music, bg: 'bg-pink-100', text: 'text-pink-600', label: 'NEW MUSIC', gradient: 'from-pink-100 to-rose-100' },
    shop: { icon: ShoppingBag, bg: 'bg-purple-100', text: 'text-purple-600', label: 'MERCH DROP', gradient: 'from-purple-100 to-pink-100' },
    events: { icon: Calendar, bg: 'bg-blue-100', text: 'text-blue-600', label: 'UPCOMING SHOW', gradient: 'from-blue-100 to-indigo-100' },
    blog: { icon: Newspaper, bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'NEW POST', gradient: 'from-emerald-100 to-teal-100' },
    official: { icon: Mic2, bg: 'bg-amber-100', text: 'text-amber-600', label: 'OFFICIAL', gradient: 'from-amber-100 to-orange-100' },
    brands: { icon: Briefcase, bg: 'bg-violet-100', text: 'text-violet-600', label: 'BRAND NEWS', gradient: 'from-violet-100 to-purple-100' }
  }

  useEffect(() => {
    fetchProfileImage()
    fetchFeatured()
    fetchLatestUpdates()
  }, [])

  async function fetchProfileImage() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('profile_image, name, tagline')
        .eq('id', 1)
        .single()

      if (data) {
        setProfileImage(data.profile_image)
        if (data.name) setProfileName(data.name)
        if (data.tagline) setProfileTagline(data.tagline)
      }
    } catch (error) {
      console.error('Error fetching profile image:', error)
    }
  }

  async function fetchFeatured() {
    try {
      const { data, error } = await supabase
        .from('featured_posts')
        .select('*')
        .order('position', { ascending: true })

      if (error) throw error
      setFeatured(data || [])
    } catch (error) {
      console.error('Error fetching featured:', error)
    }
  }

  async function fetchLatestUpdates() {
    try {
      const [music, events, shop, blog, official, brands] = await Promise.all([
        supabase.from('music').select('id, title, description, created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('events').select('id, title, description, created_at').eq('status', 'upcoming').order('created_at', { ascending: false }).limit(1),
        supabase.from('products').select('id, name, caption, created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('blog_posts').select('id, title, excerpt, created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('announcements').select('id, title, content, created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('brands').select('id, brand_name, caption, created_at').order('created_at', { ascending: false }).limit(1)
      ])

      const allUpdates: Update[] = []

      if (music.data?.[0]) {
        allUpdates.push({
          id: music.data[0].id,
          type: 'music',
          title: music.data[0].title,
          description: music.data[0].description || 'New music release',
          time: '2 hours ago',
          icon: pageConfig.music.icon,
          color: 'pink'
        })
      }

      if (events.data?.[0]) {
        allUpdates.push({
          id: events.data[0].id,
          type: 'events',
          title: events.data[0].title,
          description: events.data[0].description || 'Upcoming show',
          time: '3 days ago',
          icon: pageConfig.events.icon,
          color: 'blue'
        })
      }

      if (shop.data?.[0]) {
        allUpdates.push({
          id: shop.data[0].id,
          type: 'shop',
          title: shop.data[0].name,
          description: shop.data[0].caption || 'New merch available',
          time: 'Yesterday',
          icon: pageConfig.shop.icon,
          color: 'purple'
        })
      }

      setUpdates(allUpdates.slice(0, 3))
    } catch (error) {
      console.error('Error fetching updates:', error)
    } finally {
      setLoading(false)
    }
  }

  function getFeaturedLink(post: FeaturedPost): string {
    switch (post.page_type) {
      case 'music': return `/music#${post.item_id}`
      case 'shop': return `/shop#${post.item_id}`
      case 'events': return `/events#${post.item_id}`
      case 'blog': return `/blog#${post.item_id}`
      case 'official': return `/official#${post.item_id}`
      case 'brands': return `/brands#${post.item_id}`
      default: return '/'
    }
  }

  function getUpdateLink(update: Update): string {
    switch (update.type) {
      case 'music': return `/music#${update.id}`
      case 'events': return `/events#${update.id}`
      case 'shop': return `/shop#${update.id}`
      case 'blog': return `/blog#${update.id}`
      case 'official': return `/official#${update.id}`
      case 'brands': return `/brands#${update.id}`
      default: return '/'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-pink-600 text-center">
            {profileName.toUpperCase()}
          </h1>
          <p className="text-xs text-pink-400 text-center mt-1">{profileTagline}</p>
        </div>
      </header>

      {/* Profile Strip */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 hover:shadow-md transition">
          <div className="flex items-center gap-4">
            {/* Profile Image - Now from settings */}
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md overflow-hidden">
              {profileImage ? (
                <Image 
                  src={profileImage} 
                  alt={profileName} 
                  fill
                  sizes="(max-width: 768px) 64px, 80px"
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl md:text-3xl text-white">✨</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-800 text-lg md:text-xl">{profileName}</h2>
              <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                @spicediana 
                <span className="mx-2">·</span>
                <Heart size={12} className="text-pink-500" />
                10M+ fans
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star size={10} />
                  Verified Artist
                </span>
                <span className="px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full text-xs font-medium">
                  Uganda 🇺🇬
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition">
            <div className="font-bold text-pink-600 text-lg md:text-xl">50+</div>
            <div className="text-xs text-gray-500">Songs</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition">
            <div className="font-bold text-pink-600 text-lg md:text-xl">100+</div>
            <div className="text-xs text-gray-500">Shows</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition">
            <div className="font-bold text-pink-600 text-lg md:text-xl">10M+</div>
            <div className="text-xs text-gray-500">Fans</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
          <span>EXPLORE</span>
          <Heart size={12} className="text-pink-400" />
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <Link href="/music" className="bg-white rounded-xl p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition group">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-pink-200 transition">
              <Music size={18} className="text-pink-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Music</span>
          </Link>
          <Link href="/shop" className="bg-white rounded-xl p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition group">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-pink-200 transition">
              <ShoppingBag size={18} className="text-pink-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Shop</span>
          </Link>
          <Link href="/events" className="bg-white rounded-xl p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition group">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-pink-200 transition">
              <Calendar size={18} className="text-pink-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Events</span>
          </Link>
          <Link href="/official" className="bg-white rounded-xl p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition group">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-pink-200 transition">
              <Mic2 size={18} className="text-pink-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Official</span>
          </Link>
        </div>
      </div>

      {/* Featured Content */}
      {featured.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Star size={14} className="text-yellow-500" />
            <span>FEATURED</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((post) => {
              const config = pageConfig[post.page_type]
              const Icon = config.icon
              
              return (
                <Link
                  key={post.id}
                  href={getFeaturedLink(post)}
                  className="group cursor-pointer"
                >
                  <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-white/50`}>
                    <div className="flex items-start gap-4">
                      <div className="relative w-20 h-20 bg-white/80 rounded-xl overflow-hidden shadow-md flex-shrink-0 backdrop-blur-sm">
                        {post.item_data?.image_url ? (
                          <Image
                            src={post.item_data.image_url}
                            alt={post.item_data.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon size={28} className={config.text} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-2">
                          <Icon size={12} className={config.text} />
                          <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">
                          {post.item_data?.title}
                        </h4>
                        {post.page_type === 'events' && post.item_data?.date && (
                          <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                            <Calendar size={10} />
                            {post.item_data.date}
                          </p>
                        )}
                        {post.page_type === 'shop' && post.item_data?.price_usd && (
                          <p className="text-xs font-medium text-pink-600 mb-2">${post.item_data.price_usd}</p>
                        )}
                        
                        <div className={`inline-flex items-center gap-1 text-xs ${config.text} font-medium bg-white/60 px-3 py-1.5 rounded-full backdrop-blur-sm group-hover:bg-white group-hover:shadow-sm transition-all`}>
                          <span>View</span>
                          <ChevronRight size={12} className="group-hover:translate-x-1 transition" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Latest Updates */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Clock size={14} />
            LATEST UPDATES
          </h3>
          <Link href="/blog" className="text-xs text-pink-600 flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full hover:bg-pink-100 transition">
            View all <ChevronRight size={10} />
          </Link>
        </div>

        <div className="space-y-3">
          {updates.length > 0 ? (
            updates.map((update, index) => {
              const Icon = update.icon
              
              return (
                <Link
                  key={index}
                  href={getUpdateLink(update)}
                  className="block bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 ${pageConfig[update.type].bg} rounded-full flex items-center justify-center`}>
                      <Icon size={14} className={pageConfig[update.type].text} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${pageConfig[update.type].text}`}>
                        {pageConfig[update.type].label}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {update.time}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
                  </div>
                  <p className="text-sm text-gray-800 pl-11">{update.description}</p>
                </Link>
              )
            })
          ) : (
            <>
              <Link href="/music" className="block bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Music size={14} className="text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-pink-600 font-medium">NEW MUSIC</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      2 hours ago
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-sm text-gray-800 pl-11">My new single "Sitya Loss" is out everywhere! Link in bio 🔥</p>
              </Link>

              <Link href="/events" className="block bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-blue-600 font-medium">UPCOMING SHOW</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      3 days ago
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-sm text-gray-800 pl-11">Lugogo Cricket Oval · June 15th. Get your tickets now!</p>
              </Link>

              <Link href="/shop" className="block bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShoppingBag size={14} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-purple-600 font-medium">MERCH DROP</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      Yesterday
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-sm text-gray-800 pl-11">Limited edition hoodies available now. Get yours before they're gone!</p>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-pink-100 py-2 z-30">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex justify-between min-w-max px-4 gap-6 md:gap-8 mx-auto">
            <Link href="/" className="flex flex-col items-center text-pink-600">
              <Home size={18} />
              <span className="text-xs mt-1">Home</span>
            </Link>
            <Link href="/music" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Music size={18} />
              <span className="text-xs mt-1">Music</span>
            </Link>
            <Link href="/shop" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <ShoppingBag size={18} />
              <span className="text-xs mt-1">Shop</span>
            </Link>
            <Link href="/events" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Calendar size={18} />
              <span className="text-xs mt-1">Events</span>
            </Link>
            <Link href="/team" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Users size={18} />
              <span className="text-xs mt-1">Team</span>
            </Link>
            <Link href="/official" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Mic2 size={18} />
              <span className="text-xs mt-1">Official</span>
            </Link>
            <Link href="/blog" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Newspaper size={18} />
              <span className="text-xs mt-1">Blog</span>
            </Link>
            <Link href="/brands" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Briefcase size={18} />
              <span className="text-xs mt-1">Brands</span>
            </Link>
            <Link href="/about" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Info size={18} />
              <span className="text-xs mt-1">About</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}