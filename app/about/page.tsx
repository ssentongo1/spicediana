'use client'

import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Download, Heart, Calendar, Music, Briefcase } from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

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
    profileImage: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (data) {
        setProfile({
          name: data.name || 'Spice Diana',
          tagline: data.tagline || 'The People\'s Princess',
          bio: data.bio || profile.bio,
          born: data.born || 'Kampala, Uganda',
          genre: data.genre || 'Afrobeat, Dancehall, Pop',
          yearsActive: data.years_active || '2018 - present',
          label: data.label || 'Spice Music',
          email: data.email || 'booking@spicediana.com',
          phone: data.phone || '+256 700 000000',
          location: data.location || 'Kampala, Uganda',
          profileImage: data.profile_image || null
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
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

      {/* Profile Card - Now with dynamic image */}
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
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 p-4 md:p-6">
          <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-2 md:mb-3 flex items-center gap-2">
            <Heart size={16} className="md:w-5 md:h-5 text-pink-600" />
            Bio
          </h3>
          <div className="space-y-3 text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {profile.bio}
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="max-w-4xl mx-auto px-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 p-4 md:p-6">
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
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 p-4 md:p-6">
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