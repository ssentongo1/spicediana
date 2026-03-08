'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Megaphone,
  AlertCircle,
  Calendar,
  Music,
  Briefcase,
  Heart,
  AlertTriangle,
  Crown,
  X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Announcement {
  id: number
  title: string
  content: string
  type: 'music' | 'business' | 'foundation' | 'urgent' | 'general'
  date: string
  urgent: boolean
  created_at: string
  user_id?: number | null
}

export default function OfficialPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [spiceProfile, setSpiceProfile] = useState<any>(null)

  useEffect(() => {
    fetchSpiceProfile()
    fetchAnnouncements()
  }, [])

  async function fetchSpiceProfile() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_spice, is_verified')
        .eq('is_spice', true)
        .single()
      
      setSpiceProfile(data)
    } catch (error) {
      console.error('Error fetching spice profile:', error)
    }
  }

  async function fetchAnnouncements() {
    setLoading(true)
    try {
      // Simple fetch - just announcements
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setAnnouncements(data || [])
    } catch (error: any) {
      console.error('Error fetching announcements:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = selectedType === 'all' 
    ? announcements 
    : announcements.filter(a => a.type === selectedType)

  const types = ['all', 'urgent', 'music', 'business', 'foundation', 'general']

  function getTypeIcon(type: string) {
    switch(type) {
      case 'urgent': return <AlertTriangle size={14} className="md:w-4 md:h-4" />
      case 'music': return <Music size={14} className="md:w-4 md:h-4" />
      case 'business': return <Briefcase size={14} className="md:w-4 md:h-4" />
      case 'foundation': return <Heart size={14} className="md:w-4 md:h-4" />
      default: return <Megaphone size={14} className="md:w-4 md:h-4" />
    }
  }

  function getTypeColor(type: string) {
    switch(type) {
      case 'urgent': return 'bg-red-100 text-red-600 border-red-200'
      case 'music': return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'business': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'foundation': return 'bg-green-100 text-green-600 border-green-200'
      default: return 'bg-pink-100 text-pink-600 border-pink-200'
    }
  }

  function openAnnouncementModal(announcement: Announcement) {
    setSelectedAnnouncement(announcement)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
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
              Official Communications
            </h1>
            <p className="text-sm text-gray-500">Latest news directly from Spice Diana</p>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 flex items-center gap-1 md:gap-2 ${
                selectedType === type
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-pink-50 border border-pink-100'
              }`}
            >
              {getTypeIcon(type)}
              <span className="capitalize">{type}</span>
              {type !== 'all' && (
                <span className={`text-xs px-1 py-0.5 rounded-full ${
                  selectedType === type 
                    ? 'bg-white/20 text-white' 
                    : 'bg-pink-100 text-pink-600'
                }`}>
                  {announcements.filter(a => a.type === type).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-4xl mx-auto px-4">
        {filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((item) => {
              // Check if this is Spice's post (user_id matches spice profile)
              const isSpicePost = spiceProfile && item.user_id === spiceProfile.id
              
              return (
                <div 
                  key={item.id}
                  onClick={() => openAnnouncementModal(item)}
                  className={`cursor-pointer transition-all ${
                    isSpicePost 
                      ? 'bg-gradient-to-r from-yellow-50 to-pink-50 rounded-xl border-2 border-yellow-200 hover:shadow-lg'
                      : `bg-white rounded-xl border-2 overflow-hidden hover:shadow-lg ${
                          item.urgent ? 'border-red-200' : 'border-pink-100'
                        }`
                  }`}
                >
                  <div className="p-4 md:p-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {isSpicePost ? (
                        // Spice's post header
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#1DA1F2] rounded-full flex items-center justify-center">
                              <Crown size={14} className="text-white" />
                            </div>
                            <span className="font-semibold text-gray-800">Spice Diana</span>
                            <div className="flex items-center justify-center w-5 h-5 bg-[#1DA1F2] rounded-full shadow-sm">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                              </svg>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 ml-auto">{item.date}</span>
                        </>
                      ) : (
                        // Regular announcement header
                        <>
                          <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                            {item.type.toUpperCase()}
                          </span>
                          
                          {item.urgent && (
                            <span className="bg-red-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <AlertCircle size={10} className="md:w-3 md:h-3" />
                              URGENT
                            </span>
                          )}

                          <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                            <Calendar size={10} className="md:w-3 md:h-3" />
                            {item.date}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className={`text-base md:text-xl font-bold mb-2 ${
                      isSpicePost ? 'text-gray-900' : 'text-gray-800'
                    }`}>
                      {isSpicePost ? (
                        <span className="flex items-center gap-2">
                          ✨ {item.title}
                        </span>
                      ) : (
                        item.title
                      )}
                    </h2>
                    
                    {/* Content Preview */}
                    <p className="text-sm md:text-base text-gray-600 line-clamp-3 md:line-clamp-4">
                      {item.content}
                    </p>

                    {/* Read More Indicator */}
                    <div className="mt-3 text-pink-600 text-xs md:text-sm font-medium">
                      Read full {isSpicePost ? 'message' : 'announcement'} →
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-pink-100">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone size={24} className="md:w-8 md:h-8 text-pink-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No announcements yet</h3>
            <p className="text-sm md:text-base text-gray-500">Check back soon for official updates</p>
          </div>
        )}
      </div>

      {/* Announcement Details Modal */}
      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl md:rounded-3xl shadow-2xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-3 md:p-6 rounded-t-xl md:rounded-t-3xl">
              <div className="flex items-start gap-2 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-100 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                  {spiceProfile && selectedAnnouncement.user_id === spiceProfile.id ? (
                    <div className="w-full h-full bg-[#1DA1F2] rounded-lg flex items-center justify-center">
                      <Crown size={18} className="md:w-6 md:h-6 text-white" />
                    </div>
                  ) : selectedAnnouncement.type === 'urgent' ? (
                    <AlertTriangle size={18} className="md:w-6 md:h-6 text-red-600" />
                  ) : (
                    <Megaphone size={18} className="md:w-6 md:h-6 text-pink-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h2 className="text-base md:text-2xl font-bold text-gray-800 line-clamp-2">
                    {spiceProfile && selectedAnnouncement.user_id === spiceProfile.id ? (
                      <span className="flex items-center gap-2">
                        ✨ {selectedAnnouncement.title}
                      </span>
                    ) : (
                      selectedAnnouncement.title
                    )}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {spiceProfile && selectedAnnouncement.user_id === spiceProfile.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Spice Diana</span>
                        <div className="flex items-center justify-center w-5 h-5 bg-[#1DA1F2] rounded-full">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getTypeColor(selectedAnnouncement.type)}`}>
                          {getTypeIcon(selectedAnnouncement.type)}
                          {selectedAnnouncement.type.toUpperCase()}
                        </span>
                        {selectedAnnouncement.urgent && (
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                            <AlertCircle size={10} />
                            URGENT
                          </span>
                        )}
                      </>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                      <Calendar size={10} />
                      {selectedAnnouncement.date}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-3 right-3 md:static w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-pink-50 flex items-center justify-center transition flex-shrink-0"
                >
                  <X size={16} className="md:w-5 md:h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {/* Content */}
              <div className="prose max-w-none">
                <p className="text-sm md:text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedAnnouncement.content}
                </p>
              </div>

              {/* Official Signature */}
              <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-pink-100 flex items-center gap-2">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  {spiceProfile && selectedAnnouncement.user_id === spiceProfile.id ? (
                    <Crown size={12} className="md:w-4 md:h-4 text-[#1DA1F2]" />
                  ) : (
                    <Megaphone size={12} className="md:w-4 md:h-4 text-pink-600" />
                  )}
                </div>
                <span className="text-xs md:text-sm text-gray-500">
                  — {spiceProfile && selectedAnnouncement.user_id === spiceProfile.id ? 'Spice Diana' : 'Spice Diana Official'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}