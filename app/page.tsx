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
  Star,
  Camera,
  Film,
  X,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Music2,
  DollarSign,
  Volume2,
  VolumeX,
  Mail,
  UserPlus,
  MapPin,
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
import { formatNumber } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'

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

interface FeedMedia {
  id: number
  media_url: string
  media_type: 'image' | 'video'
  position: number
}

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

interface SocialLink {
  id: number
  platform: string
  url: string
  icon: string
  is_active: boolean
  display_order: number
}

interface StreamingPlatform {
  id: number
  name: string
  url: string
  image_url: string | null
  is_active: boolean
  display_order: number
}

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

interface Ad {
  id: number
  title: string
  description: string | null
  ad_type: 'image' | 'video' | 'adsense'
  media_url: string | null
  link_url: string | null
  adsense_code: string | null
  is_active: boolean
}

// Platform icons mapping
const platformIcons: { [key: string]: any } = {
  instagram: Instagram,
  twitter: Twitter,
  x: X,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  spotify: Music2,
  apple: Music2,
  boomplay: Music2,
  audiomack: Music2,
  deezer: Music2,
  amazon: Music2,
  other: Globe
}

export default function HomePage() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('Spice Diana')
  const [profileTagline, setProfileTagline] = useState('The People\'s Princess')
  const [featured, setFeatured] = useState<FeaturedPost[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [feedPostsCount, setFeedPostsCount] = useState(0)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [streamingPlatforms, setStreamingPlatforms] = useState<StreamingPlatform[]>([])
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState<{[key: number]: number}>({})
  const [videoMuted, setVideoMuted] = useState<{[key: string]: boolean}>({})
  
  // Comments states
  const [comments, setComments] = useState<{[key: number]: Comment[]}>({})
  const [showComments, setShowComments] = useState<number | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  
  // Follow states
  const [appFollowers, setAppFollowers] = useState(0)
  const [socialTotal, setSocialTotal] = useState('10M+')
  const [isFollowing, setIsFollowing] = useState(false)
  const [spiceProfile, setSpiceProfile] = useState<any>(null)

  // Profile modal states
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profilePostsCount, setProfilePostsCount] = useState(0)
  const [profileLikesReceived, setProfileLikesReceived] = useState(0)

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
    // Load cached follow state immediately
    const cachedFollow = localStorage.getItem('following_spice')
    if (cachedFollow !== null) {
      setIsFollowing(cachedFollow === 'true')
    }

    fetchProfileImage()
    fetchFeatured()
    fetchLatestUpdates()
    fetchFeedPosts()
    fetchFeedPostsCount()
    fetchSocialLinks()
    fetchStreamingPlatforms()
    fetchYouTubeVideos()
    fetchAds()
    fetchSpiceProfile()
    fetchSocialTotal()
  }, [])

  // Listen for storage changes (when user logs in/out)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'team_user') {
        fetchFeedPosts()
        fetchFeedPostsCount()
        fetchSpiceProfile()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
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

  async function fetchSocialTotal() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('social_total')
        .eq('id', 1)
        .single()

      if (data?.social_total) {
        setSocialTotal(data.social_total)
      }
    } catch (error) {
      console.error('Error fetching social total:', error)
    }
  }

  async function fetchFeedPostsCount() {
    try {
      const { count } = await supabase
        .from('feed_posts')
        .select('*', { count: 'exact', head: true })
      
      setFeedPostsCount(count || 0)
    } catch (error) {
      console.error('Error fetching feed posts count:', error)
    }
  }

  async function fetchSpiceProfile() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, followers')
        .eq('is_spice', true)
        .single()
      
      if (data) {
        setSpiceProfile(data)
        setAppFollowers(data.followers || 0)
        
        const userStr = localStorage.getItem('team_user')
        if (userStr) {
          const user = JSON.parse(userStr)
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
          
          const isFollowed = !!followData
          setIsFollowing(isFollowed)
          // Cache the result
          localStorage.setItem('following_spice', isFollowed.toString())
        }
      }
    } catch (error) {
      console.error('Error fetching spice profile:', error)
    }
  }

  async function handleFollowToggle() {
    const userStr = localStorage.getItem('team_user')
    if (!userStr) {
      alert('Please login to follow Spice')
      return
    }

    const user = JSON.parse(userStr)

    // Optimistically update UI
    const newFollowingState = !isFollowing
    setIsFollowing(newFollowingState)
    localStorage.setItem('following_spice', newFollowingState.toString())

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('user_id', user.id)

        const newCount = appFollowers - 1
        setAppFollowers(newCount)
        
        await supabase
          .from('profiles')
          .update({ followers: newCount })
          .eq('id', spiceProfile.id)
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert([{ user_id: user.id }])

        const newCount = appFollowers + 1
        setAppFollowers(newCount)
        
        await supabase
          .from('profiles')
          .update({ followers: newCount })
          .eq('id', spiceProfile.id)
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!newFollowingState)
      localStorage.setItem('following_spice', (!newFollowingState).toString())
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status. Please try again.')
    }
  }

  async function handleBusinessClick() {
    window.location.href = 'mailto:booking@spicediana.com?subject=Business%20Inquiry'
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
          time: '2h',
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
          time: '3d',
          icon: pageConfig.events.icon,
          color: 'blue'
        })
      }

      if (shop.data?.[0]) {
        allUpdates.push({
          id: shop.data[0].id,
          type: 'shop',
          title: shop.data[0].name,
          description: shop.data[0].caption || 'New merch',
          time: '1d',
          icon: pageConfig.shop.icon,
          color: 'purple'
        })
      }

      setUpdates(allUpdates.slice(0, 3))
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  // FIXED: fetchFeedPosts now loads likes AND comments automatically
  async function fetchFeedPosts() {
    try {
      const { data: postsData } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

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
        setFeedPosts(postsWithLikesAndComments)
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
        setFeedPosts(postsWithComments)
      }
    } catch (error) {
      console.error('Error fetching feed:', error)
    }
  }

  async function fetchSocialLinks() {
    try {
      const { data } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setSocialLinks(data || [])
    } catch (error) {
      console.error('Error fetching social links:', error)
    }
  }

  async function fetchStreamingPlatforms() {
    try {
      const { data } = await supabase
        .from('streaming_platforms')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setStreamingPlatforms(data || [])
    } catch (error) {
      console.error('Error fetching streaming platforms:', error)
    }
  }

  async function fetchYouTubeVideos() {
    try {
      const { data } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)

      setYoutubeVideos(data || [])
    } catch (error) {
      console.error('Error fetching YouTube videos:', error)
    }
  }

  async function fetchAds() {
    try {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      setAds(data || [])
    } catch (error) {
      console.error('Error fetching ads:', error)
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
  async function handleFeedLike(postId: number) {
    const userStr = localStorage.getItem('team_user')
    if (!userStr) {
      alert('Please login to like posts')
      return
    }

    const post = feedPosts[0]
    if (!post) return

    // Optimistically update UI immediately
    const newLikedState = !post.user_has_liked
    const newLikeCount = newLikedState ? post.likes_count + 1 : post.likes_count - 1

    setFeedPosts([{
      ...post,
      user_has_liked: newLikedState,
      likes_count: newLikeCount
    }])

    const user = JSON.parse(userStr)

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
      setFeedPosts([{
        ...post,
        user_has_liked: post.user_has_liked,
        likes_count: post.likes_count
      }])
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

  function toggleVideoMute(adId: number) {
    setVideoMuted(prev => ({ ...prev, [adId]: !prev[adId] }))
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

  // PREMIUM LOADING SPINNER
  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
      {/* Header - NO BACK ARROW */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-pink-600 text-center">
            {profileName.toUpperCase()}
          </h1>
          <p className="text-sm text-pink-400 text-center mt-1">{profileTagline}</p>
        </div>
      </header>

      {/* Instagram-style Profile Section */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Profile Picture - NOW CLICKABLE */}
        <Link href="/about" className="flex justify-center mb-4 group">
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md overflow-hidden group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
            {profileImage ? (
              <Image 
                src={profileImage} 
                alt={profileName} 
                fill
                sizes="(max-width: 768px) 96px, 112px"
                className="object-cover"
                loading="eager"
                priority
              />
            ) : (
              <span className="text-3xl md:text-4xl text-white">✨</span>
            )}
          </div>
        </Link>

        {/* Name and Username - NAME NOW CLICKABLE */}
        <div className="text-center mb-3">
          <Link href="/about" className="inline-block group">
            <h2 className="font-bold text-gray-800 text-xl md:text-2xl group-hover:text-pink-600 transition">
              {profileName}
            </h2>
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">@spicediana</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star size={10} />
              Verified Artist
            </span>
            <span className="bg-pink-50 text-pink-600 text-xs px-2 py-0.5 rounded-full">
              Uganda 🇺🇬
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-8 mb-4">
          <Link href="/feed" className="text-center hover:opacity-80 transition">
            <div className="font-bold text-gray-800 text-lg">{feedPostsCount}</div>
            <div className="text-xs text-gray-500">posts</div>
          </Link>
          <div className="text-center">
            <div className="font-bold text-gray-800 text-lg">{formatNumber(appFollowers)}</div>
            <div className="text-xs text-gray-500">followers</div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(() => {
            const userStr = typeof window !== 'undefined' ? localStorage.getItem('team_user') : null
            const currentUser = userStr ? JSON.parse(userStr) : null
            return currentUser && !currentUser.is_spice ? (
              <button
                onClick={handleFollowToggle}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : (
              <button className="w-full bg-pink-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-pink-700 transition opacity-50 cursor-not-allowed" disabled>
                Follow
              </button>
            )
          })()}
          
          <button
            onClick={handleBusinessClick}
            className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            Business
          </button>
        </div>

        {/* App-specific follower count */}
        <p className="text-xs text-gray-400 text-center mb-4">
          {appFollowers} {appFollowers === 1 ? 'follower' : 'followers'} on this app
        </p>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            {socialLinks.map((link) => {
              // Check if it's Twitter and replace with X logo
              const Icon = link.platform.toLowerCase() === 'twitter' 
                ? X 
                : (platformIcons[link.icon.toLowerCase()] || Globe)
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-pink-50 rounded-full flex items-center justify-center hover:bg-pink-100 transition group"
                  title={link.platform}
                >
                  <Icon size={16} className="text-pink-600 group-hover:scale-110 transition" />
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Spice's Feed - Latest Post Only - NOW ENTIRE CARD CLICKABLE */}
      {feedPosts.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <Camera size={14} />
              LATEST
            </h3>
            <Link href="/feed" className="text-xs text-pink-600 flex items-center gap-1 hover:underline">
              View all <ChevronRight size={10} />
            </Link>
          </div>

          {feedPosts.slice(0, 1).map((post) => (
            <div key={post.id} className="bg-white rounded-lg border border-pink-100 overflow-hidden shadow-sm hover:shadow-md transition group">
              {/* Post Header - Not clickable (keeps like/comment buttons working) */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 bg-pink-100 rounded-full overflow-hidden flex-shrink-0">
                  {profileImage ? (
                    <Image src={profileImage} alt="Spice" width={36} height={36} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera size={14} className="text-pink-600" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-800 text-sm">Spice Diana</span>
                    <span className="bg-blue-500 text-white text-[9px] px-1 py-0.5 rounded-full">✓</span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Media Carousel - Clickable area */}
              <Link href="/feed" className="block relative w-full bg-black group/media">
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
                          <div className="relative w-full h-full">
                            <video
                              src={media.media_url}
                              className="w-full h-full object-contain"
                              muted={!videoMuted[muteKey]}
                              loop
                              autoPlay
                              playsInline
                            />
                          </div>
                        )}
                      </SwiperSlide>
                    )
                  })}
                </Swiper>

                {post.media.length > 1 && (
                  <>
                    <button className={`swiper-button-prev-${post.id} absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition`}>
                      <ChevronLeft size={16} />
                    </button>
                    <button className={`swiper-button-next-${post.id} absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition`}>
                      <ChevronRightIcon size={16} />
                    </button>
                    
                    <div className="absolute top-2 right-2 z-10 bg-black/50 text-white px-2 py-0.5 rounded-full text-[9px]">
                      {activeSlide[post.id] !== undefined ? activeSlide[post.id] + 1 : 1} / {post.media.length}
                    </div>
                  </>
                )}

                {/* Video mute button - Needs to be separate to prevent navigation */}
                {post.media.some(m => m.media_type === 'video') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const videoMedia = post.media.find(m => m.media_type === 'video')
                      if (videoMedia) toggleVideoMute(videoMedia.id)
                    }}
                    className="absolute bottom-3 right-3 z-20 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black/80 transition"
                  >
                    {videoMuted[`${post.id}-${post.media.find(m => m.media_type === 'video')?.id}`] ? (
                      <Volume2 size={12} />
                    ) : (
                      <VolumeX size={12} />
                    )}
                  </button>
                )}
              </Link>

              {/* Post Actions - Keep interactive */}
              <div className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <button
                    onClick={() => handleFeedLike(post.id)}
                    className={`flex items-center gap-1 transition ${
                      post.user_has_liked 
                        ? 'text-pink-600' 
                        : 'text-gray-500 hover:text-pink-600'
                    }`}
                  >
                    <Heart size={16} fill={post.user_has_liked ? 'currentColor' : 'none'} />
                    <span className="text-xs font-medium">{post.likes_count}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition"
                  >
                    <MessageCircle size={16} />
                    <span className="text-xs font-medium">
                      {comments[post.id]?.length || 0}
                    </span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-pink-600 transition ml-auto">
                    <Send size={16} />
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
      )}

      {/* YouTube Video */}
      {youtubeVideos.length > 0 && youtubeVideos[0] && (
        <div className="max-w-2xl mx-auto px-4 mb-5">
          <h3 className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Youtube size={14} className="text-red-500" />
            LATEST VIDEO
          </h3>
          
          <div className="bg-white rounded-lg shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition">
            <a 
              href={youtubeVideos[0].youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative w-full aspect-video bg-black group"
            >
              <Image
                src={youtubeVideos[0].thumbnail_url || `https://img.youtube.com/vi/${youtubeVideos[0].youtube_id}/maxresdefault.jpg`}
                alt={youtubeVideos[0].title}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition">
                  <Youtube size={24} className="text-white ml-1" />
                </div>
              </div>
            </a>
            
            <div className="p-4">
              <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">{youtubeVideos[0].title}</h4>
              {youtubeVideos[0].description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{youtubeVideos[0].description}</p>
              )}
              
              <a
                href={youtubeVideos[0].youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition shadow-sm"
              >
                <Youtube size={14} />
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stream Spice's Music */}
      {streamingPlatforms.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-5">
          <h3 className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Music2 size={14} />
            STREAM MUSIC
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {streamingPlatforms.map((platform) => (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-lg p-3 text-center shadow-sm border border-pink-100 hover:shadow-md transition group"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full overflow-hidden bg-pink-50 flex items-center justify-center group-hover:scale-110 transition">
                  {platform.image_url ? (
                    <Image 
                      src={platform.image_url} 
                      alt={platform.name} 
                      width={40} 
                      height={40} 
                      className="object-cover"
                    />
                  ) : (
                    <Music2 size={18} className="text-pink-400" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700">{platform.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Featured Content */}
      {featured.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-5">
          <h3 className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-2">
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
                  <div className={`bg-gradient-to-br ${config.gradient} rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-white/50`}>
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 bg-white/80 rounded-lg overflow-hidden shadow-sm flex-shrink-0 backdrop-blur-sm">
                        {post.item_data?.image_url ? (
                          <Image
                            src={post.item_data.image_url}
                            alt={post.item_data.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon size={22} className={config.text} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Icon size={10} className={config.text} />
                          <span className={`text-[10px] font-medium ${config.text}`}>{config.label}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-xs line-clamp-2 mb-1">
                          {post.item_data?.title}
                        </h4>
                        {post.page_type === 'events' && post.item_data?.date && (
                          <p className="text-[9px] text-gray-500 flex items-center gap-1 mb-1">
                            <Calendar size={8} />
                            {post.item_data.date}
                          </p>
                        )}
                        {post.page_type === 'shop' && post.item_data?.price_usd && (
                          <p className="text-[9px] font-medium text-pink-600 mb-1">${post.item_data.price_usd}</p>
                        )}
                        
                        <div className={`inline-flex items-center gap-1 text-[9px] ${config.text} font-medium bg-white/60 px-2 py-1 rounded-full backdrop-blur-sm group-hover:bg-white group-hover:shadow-sm transition-all`}>
                          <span>View</span>
                          <ChevronRight size={8} className="group-hover:translate-x-1 transition" />
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

      {/* Advertisement Card */}
      {ads.length > 0 && ads[0] && (
        <div className="max-w-2xl mx-auto px-4 mb-5">
          <div className="bg-white rounded-lg shadow-sm border border-pink-100 overflow-hidden hover:shadow-md transition relative">
            <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm text-white text-[9px] px-2 py-1 rounded-full flex items-center gap-1">
              <span>📢</span>
              <span className="font-medium">Ad</span>
            </div>

            {ads[0].ad_type === 'adsense' ? (
              <div className="p-4">
                <div className="text-[9px] text-gray-400 mb-2 flex items-center gap-1">
                  <DollarSign size={10} />
                  Advertisement
                </div>
                <div dangerouslySetInnerHTML={{ __html: ads[0].adsense_code || '' }} />
              </div>
            ) : (
              <a 
                href={ads[0].link_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {ads[0].ad_type === 'image' && ads[0].media_url && (
                  <div className="relative w-full aspect-video bg-gray-100">
                    <Image
                      src={ads[0].media_url}
                      alt={ads[0].title}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {ads[0].ad_type === 'video' && ads[0].media_url && (
                  <div className="relative w-full aspect-video bg-black group">
                    <video
                      src={ads[0].media_url}
                      className="w-full h-full object-cover"
                      muted={!videoMuted[ads[0].id]}
                      loop
                      autoPlay
                      playsInline
                    />
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleVideoMute(ads[0].id)
                      }}
                      className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-full hover:bg-black/80 transition"
                    >
                      {videoMuted[ads[0].id] ? (
                        <Volume2 size={12} />
                      ) : (
                        <VolumeX size={12} />
                      )}
                    </button>
                  </div>
                )}

                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">{ads[0].title}</h4>
                  {ads[0].description && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{ads[0].description}</p>
                  )}
                  <span className="text-pink-600 text-xs font-medium inline-flex items-center gap-1">
                    Learn more <ChevronRight size={10} />
                  </span>
                </div>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Latest Updates */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <Clock size={14} />
            UPDATES
          </h3>
          <Link href="/blog" className="text-[9px] text-pink-600 flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-full hover:bg-pink-100 transition">
            View all <ChevronRight size={8} />
          </Link>
        </div>

        <div className="space-y-2">
          {updates.length > 0 ? (
            updates.map((update, index) => {
              const Icon = update.icon
              
              return (
                <Link
                  key={index}
                  href={getUpdateLink(update)}
                  className="block bg-white rounded-lg p-3 shadow-sm border border-pink-100 hover:shadow-md transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${pageConfig[update.type].bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} className={pageConfig[update.type].text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] font-medium ${pageConfig[update.type].text}`}>
                        {pageConfig[update.type].label}
                      </p>
                      <p className="text-xs text-gray-800 truncate">{update.description}</p>
                    </div>
                    <div className="text-[9px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <Clock size={8} />
                      {update.time}
                    </div>
                  </div>
                </Link>
              )
            })
          ) : (
            <>
              <Link href="/music" className="block bg-white rounded-lg p-3 shadow-sm border border-pink-100 hover:shadow-md transition group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Music size={14} className="text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-pink-600 font-medium">NEW MUSIC</p>
                    <p className="text-xs text-gray-800 truncate">Sitya Loss out now!</p>
                  </div>
                  <span className="text-[9px] text-gray-400">2h</span>
                </div>
              </Link>

              <Link href="/events" className="block bg-white rounded-lg p-3 shadow-sm border border-pink-100 hover:shadow-md transition group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-blue-600 font-medium">UPCOMING SHOW</p>
                    <p className="text-xs text-gray-800 truncate">Lugogo · June 15</p>
                  </div>
                  <span className="text-[9px] text-gray-400">3d</span>
                </div>
              </Link>

              <Link href="/shop" className="block bg-white rounded-lg p-3 shadow-sm border border-pink-100 hover:shadow-md transition group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShoppingBag size={14} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-purple-600 font-medium">MERCH DROP</p>
                    <p className="text-xs text-gray-800 truncate">Limited hoodies</p>
                  </div>
                  <span className="text-[9px] text-gray-400">1d</span>
                </div>
              </Link>
            </>
          )}
        </div>
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-pink-100 py-2 z-30">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex justify-between min-w-max px-4 gap-5 md:gap-7 mx-auto">
            <Link href="/" className="flex flex-col items-center text-pink-600">
              <Home size={16} />
              <span className="text-[9px] mt-1">Home</span>
            </Link>
            <Link href="/feed" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Camera size={16} />
              <span className="text-[9px] mt-1">Feed</span>
            </Link>
            <Link href="/music" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Music size={16} />
              <span className="text-[9px] mt-1">Music</span>
            </Link>
            <Link href="/shop" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <ShoppingBag size={16} />
              <span className="text-[9px] mt-1">Shop</span>
            </Link>
            <Link href="/events" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Calendar size={16} />
              <span className="text-[9px] mt-1">Events</span>
            </Link>
            <Link href="/team" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Users size={16} />
              <span className="text-[9px] mt-1">Team</span>
            </Link>
            <Link href="/official" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Mic2 size={16} />
              <span className="text-[9px] mt-1">Official</span>
            </Link>
            <Link href="/blog" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Newspaper size={16} />
              <span className="text-[9px] mt-1">Blog</span>
            </Link>
            <Link href="/ngo" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Heart size={16} />
              <span className="text-[9px] mt-1">NGO</span>
            </Link>
            <Link href="/brands" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Briefcase size={16} />
              <span className="text-[9px] mt-1">Brands</span>
            </Link>
            <Link href="/about" className="flex flex-col items-center text-gray-400 hover:text-pink-600 transition">
              <Info size={16} />
              <span className="text-[9px] mt-1">About</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  )
}