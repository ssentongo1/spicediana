'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Download, 
  Heart, 
  Calendar, 
  Music, 
  Briefcase,
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Globe,
  Users,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  X  // This is the X (Twitter) icon
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/LoadingSpinner'

// Custom TikTok icon component
const TikTokIcon = ({ size = 18, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M19.59 6.69C18.95 6.26 18.47 5.66 18.16 5C17.85 4.34 17.73 3.62 17.81 2.9H14.43V15.53C14.43 16.41 14.15 17.27 13.64 17.97C13.13 18.67 12.41 19.18 11.59 19.42C10.77 19.66 9.9 19.62 9.1 19.31C8.3 19 7.61 18.43 7.13 17.69C6.65 16.95 6.41 16.08 6.44 15.19C6.47 14.3 6.77 13.44 7.29 12.73C7.81 12.02 8.53 11.49 9.35 11.22C10.17 10.95 11.06 10.95 11.88 11.22V7.8C10.06 7.63 8.25 8.2 6.89 9.35C5.53 10.5 4.75 12.15 4.75 13.89C4.75 15.63 5.53 17.28 6.89 18.43C8.25 19.58 10.06 20.15 11.88 19.98C13.7 19.81 15.38 18.92 16.52 17.54C17.66 16.16 18.18 14.39 18.18 12.58V7.7C19.11 8.32 20.18 8.67 21.27 8.71V5.29C20.62 5.29 19.99 5.08 19.59 4.69V6.69Z" 
      fill="currentColor"
    />
  </svg>
)

// Types
interface ProfileData {
  name: string
  tagline: string
  bio: string
  born: string
  genre: string
  yearsActive: string
  label: string
  email: string
  phone: string
  location: string
  profileImage: string | null
  socialTotal: string
}

interface SocialLink {
  id: number
  platform: string
  url: string
  icon: string
  is_active: boolean
  display_order: number
}

interface SocialStat {
  id: number
  platform: string
  username: string
  url: string
  followers: number
  icon: string
  is_active: boolean
  display_order: number
}

// Platform icons mapping with correct icons
const platformIcons: { [key: string]: any } = {
  instagram: Instagram,
  twitter: X,
  x: X,
  tiktok: TikTokIcon,
  facebook: Facebook,
  youtube: Youtube,
  spotify: Music2,
  apple: Music2,
  boomplay: Music2,
  audiomack: Music2,
  deezer: Music2,
  amazon: Music2,
  other: Globe
}

// Platform colors
const platformColors: { [key: string]: string } = {
  instagram: 'from-pink-500 to-purple-500',
  twitter: 'from-gray-800 to-gray-900',
  x: 'from-gray-800 to-gray-900',
  tiktok: 'from-gray-900 to-pink-500',
  facebook: 'from-blue-600 to-blue-700',
  youtube: 'from-red-500 to-red-600',
  spotify: 'from-green-500 to-green-600',
  apple: 'from-gray-700 to-gray-800',
  boomplay: 'from-orange-500 to-red-500',
  audiomack: 'from-yellow-500 to-orange-500',
  deezer: 'from-purple-600 to-pink-500',
  amazon: 'from-orange-500 to-orange-600',
  other: 'from-pink-400 to-pink-500'
}

// Format follower count
const formatFollowers = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  }
  return count.toString()
}

export default function AboutPage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: 'Spice Diana',
    tagline: 'The People\'s Princess',
    bio: 'Spice Diana, born Diana Nabatanzi, is one of East Africa\'s most celebrated musicians. Known for her unique blend of Afrobeat, dancehall, and pop, she has captivated audiences across Uganda and beyond. With multiple awards and hit songs, she continues to represent Ugandan music on the global stage.\n\nBeyond music, Spice is passionate about empowering young women through her foundation and various community initiatives.',
    born: 'Kampala, Uganda',
    genre: 'Afrobeat, Dancehall, Pop',
    yearsActive: '2018 - present',
    label: 'Spice Music',
    email: 'booking@spicediana.com',
    phone: '+256 700 000000',
    location: 'Kampala, Uganda',
    profileImage: null,
    socialTotal: '10M+'
  })
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [socialStats, setSocialStats] = useState<SocialStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Fetch profile settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (settingsData) {
        setProfile({
          name: settingsData.name || 'Spice Diana',
          tagline: settingsData.tagline || 'The People\'s Princess',
          bio: settingsData.bio || profile.bio,
          born: settingsData.born || 'Kampala, Uganda',
          genre: settingsData.genre || 'Afrobeat, Dancehall, Pop',
          yearsActive: settingsData.years_active || '2018 - present',
          label: settingsData.label || 'Spice Music',
          email: settingsData.email || 'booking@spicediana.com',
          phone: settingsData.phone || '+256 700 000000',
          location: settingsData.location || 'Kampala, Uganda',
          profileImage: settingsData.profile_image || null,
          socialTotal: settingsData.social_total || '10M+'
        })
      }

      // Fetch social stats (with follower counts)
      const { data: statsData } = await supabase
        .from('social_stats')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setSocialStats(statsData || [])

      // Fetch social links (for icons if needed)
      const { data: linksData } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      setSocialLinks(linksData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // PREMIUM LOADING SPINNER
  if (loading) {
    return <LoadingSpinner />
  }

  // Calculate total followers from stats
  const totalFollowers = socialStats.reduce((sum, stat) => sum + (stat.followers || 0), 0)
  const formattedTotal = totalFollowers >= 1000000 
    ? (totalFollowers / 1000000).toFixed(1) + 'M' 
    : totalFollowers >= 1000 
      ? (totalFollowers / 1000).toFixed(1) + 'K' 
      : totalFollowers.toString()

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center">
          <Link 
            href="/" 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600 mr-4"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              About Spice Diana
            </h1>
            <p className="text-sm text-gray-500">The people's princess</p>
          </div>
        </div>
      </header>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
          {/* Banner with gradient */}
          <div className="relative h-32 md:h-40 bg-gradient-to-r from-pink-600 to-pink-400">
            {/* Profile Image - Centered and overlapping */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-pink-300 to-pink-400">
                {profile.profileImage ? (
                  <Image 
                    src={profile.profileImage} 
                    alt={profile.name} 
                    fill
                    sizes="(max-width: 768px) 96px, 112px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart size={32} className="text-white/80" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-16 pb-6 px-4 md:px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{profile.name}</h2>
            <p className="text-pink-600 text-sm md:text-base mt-1">{profile.tagline}</p>
            <p className="text-xs md:text-sm text-gray-500 mt-2">Singer · Songwriter · Performer</p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="max-w-4xl mx-auto px-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-2 md:mb-3 flex items-center gap-2">
            <Heart size={16} className="md:w-5 md:h-5 text-pink-600" />
            Bio
          </h3>
          <div className="space-y-3 text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {profile.bio}
          </div>
        </div>
      </div>

      {/* ===== NEW PREMIUM SOCIAL MEDIA SECTION ===== */}
      <div className="max-w-4xl mx-auto px-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 md:p-6">
          {/* Header with total reach */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 text-base md:text-lg flex items-center gap-2">
                <Users size={18} className="text-pink-600" />
                Connect with Spice
              </h3>
              <p className="text-xs text-gray-500 mt-1">Follow on social media for latest updates</p>
            </div>
            
            {/* Total reach badge */}
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 px-4 py-2 rounded-lg inline-flex items-center gap-2">
              <TrendingUp size={16} className="text-pink-600" />
              <span className="text-xs text-gray-600">Total reach:</span>
              <span className="font-bold text-pink-600">{profile.socialTotal}</span>
            </div>
          </div>

          {/* Social Stats Grid */}
          {socialStats.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {socialStats.map((stat) => {
                const Icon = platformIcons[stat.platform.toLowerCase()] || Globe
                const color = platformColors[stat.platform.toLowerCase()] || 'from-pink-400 to-pink-500'
                
                return (
                  <a
                    key={stat.id}
                    href={stat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-gradient-to-br from-gray-50 to-white border border-pink-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    {/* Background gradient on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    {/* Platform icon */}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    
                    {/* Platform name */}
                    <p className="text-xs font-medium text-gray-500 mb-1">{stat.platform}</p>
                    
                    {/* Follower count */}
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      {formatFollowers(stat.followers || 0)}
                    </p>
                    
                    {/* Follow button */}
                    <div className="flex items-center gap-1 text-[10px] font-medium text-pink-600 group-hover:gap-2 transition-all">
                      <span>Follow</span>
                      <ExternalLink size={10} />
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            // Fallback to social links if no stats
            <div className="flex flex-wrap items-center justify-center gap-4">
              {socialLinks.map((link) => {
                const Icon = platformIcons[link.platform.toLowerCase()] || Globe
                const color = platformColors[link.platform.toLowerCase()] || 'from-pink-400 to-pink-500'
                
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center"
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-600">{link.platform}</span>
                  </a>
                )
              })}
            </div>
          )}

          {/* View all link (if more than shown) */}
          {socialStats.length > 4 && (
            <div className="mt-4 text-center">
              <button className="inline-flex items-center gap-1 text-xs text-pink-600 hover:gap-2 transition-all">
                View all platforms <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Facts */}
      <div className="max-w-4xl mx-auto px-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-3 md:mb-4">Quick Facts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="md:w-4 md:h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Born</p>
                <p className="text-sm md:text-base text-gray-800">{profile.born}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Music size={14} className="md:w-4 md:h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Genre</p>
                <p className="text-sm md:text-base text-gray-800">{profile.genre}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar size={14} className="md:w-4 md:h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Years active</p>
                <p className="text-sm md:text-base text-gray-800">{profile.yearsActive}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Briefcase size={14} className="md:w-4 md:h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Label</p>
                <p className="text-sm md:text-base text-gray-800">{profile.label}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Booking */}
      <div className="max-w-4xl mx-auto px-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-3 md:mb-4">Booking & Inquiries</h3>
          
          <div className="space-y-3 md:space-y-4">
            {/* Email */}
            <a 
              href={`mailto:${profile.email}?subject=Booking%20Inquiry`}
              className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-pink-50 transition group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-pink-200 transition">
                <Mail size={14} className="md:w-4 md:h-4 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm md:text-base text-gray-800 truncate">{profile.email}</p>
              </div>
            </a>
            
            {/* Phone */}
            <a 
              href={`tel:${profile.phone}`}
              className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-pink-50 transition group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-pink-200 transition">
                <Phone size={14} className="md:w-4 md:h-4 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Call</p>
                <p className="text-sm md:text-base text-gray-800 truncate">{profile.phone}</p>
              </div>
            </a>
            
            {/* WhatsApp */}
            <a 
              href={`https://wa.me/${profile.phone.replace(/\s+/g, '')}?text=Hello%20Spice%20Diana%20team`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-pink-50 transition group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition">
                <span className="text-green-600 font-bold text-sm md:text-base">📱</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">WhatsApp</p>
                <p className="text-sm md:text-base text-gray-800 truncate">Chat with us</p>
              </div>
            </a>
            
            {/* Location */}
            <a 
              href={`https://maps.google.com/?q=${profile.location}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-pink-50 transition group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-pink-200 transition">
                <MapPin size={14} className="md:w-4 md:h-4 text-pink-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm md:text-base text-gray-800 truncate">{profile.location}</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Press Kit */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-xl p-4 md:p-6 text-white shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download size={16} className="md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold">Press Kit</h3>
                <p className="text-xs md:text-sm text-pink-100">High-res photos, bio, and more</p>
              </div>
            </div>
            <button className="w-full md:w-auto bg-white text-pink-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-pink-50 transition shadow-md">
              Download Press Kit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}