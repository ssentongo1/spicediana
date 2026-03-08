'use client'

import Link from 'next/link'
import { ArrowLeft, Music, Play, Pause, Headphones, DollarSign, X, Calendar, Heart } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface MusicItem {
  id: number
  title: string
  price_usd: number
  price_ugx: number | null
  year: string
  type: 'single' | 'album'
  cover_url: string | null
  description: string | null
  audio_url?: string | null
}

interface Song {
  id: number
  title: string
  duration: string
  audio_url: string
  track_number: number
}

export default function MusicPage() {
  const [activeTab, setActiveTab] = useState<'singles' | 'albums'>('singles')
  const [singles, setSingles] = useState<MusicItem[]>([])
  const [albums, setAlbums] = useState<MusicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<MusicItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [albumSongs, setAlbumSongs] = useState<Song[]>([])
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchMusic()
  }, [])

  async function fetchMusic() {
    setLoading(true)
    try {
      const { data: singlesData } = await supabase
        .from('music')
        .select('*')
        .eq('type', 'single')
        .order('created_at', { ascending: false })

      const { data: albumsData } = await supabase
        .from('music')
        .select('*')
        .eq('type', 'album')
        .order('created_at', { ascending: false })

      setSingles(singlesData || [])
      setAlbums(albumsData || [])
    } catch (error) {
      console.error('Error fetching music:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAlbumSongs(albumId: number) {
    const { data } = await supabase
      .from('songs')
      .select('*')
      .eq('album_id', albumId)
      .order('track_number', { ascending: true })

    setAlbumSongs(data || [])
  }

  function handlePlay(audioUrl: string, id: number, e?: React.MouseEvent) {
    e?.stopPropagation() // Prevent card click when playing
    if (playingId === id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      const audio = new Audio(audioUrl)
      audio.play()
      audioRef.current = audio
      setPlayingId(id)

      const timer = setTimeout(() => {
        if (playingId === id) {
          audio.pause()
          setPlayingId(null)
        }
      }, 30000)

      audio.onended = () => {
        setPlayingId(null)
        clearTimeout(timer)
      }
    }
  }

  function openItemModal(item: MusicItem) {
    setSelectedItem(item)
    if (item.type === 'album') {
      fetchAlbumSongs(item.id)
    }
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading music library...</p>
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
              Music Library
            </h1>
            <p className="text-sm text-gray-500">Listen to previews, buy full tracks</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-pink-100 inline-flex">
            <button 
              onClick={() => setActiveTab('singles')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'singles' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              Singles ({singles.length})
            </button>
            <button 
              onClick={() => setActiveTab('albums')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'albums' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              Albums ({albums.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4">
        {activeTab === 'singles' ? (
          singles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {singles.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => openItemModal(item)}
                  className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  {/* Cover Image */}
                  <div className="relative h-40 md:h-48 bg-gradient-to-br from-pink-100 to-pink-50">
                    {item.cover_url ? (
                      <Image 
                        src={item.cover_url} 
                        alt={item.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={32} className="md:w-12 md:h-12 text-pink-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 md:p-5">
                    <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-1">{item.title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3">{item.year}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg md:text-2xl font-bold text-pink-600">${item.price_usd}</span>
                        {item.price_ugx && (
                          <span className="text-xs text-gray-400">UGX {item.price_ugx.toLocaleString()}</span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {item.audio_url && (
                          <button 
                            onClick={(e) => handlePlay(item.audio_url!, item.id, e)}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition ${
                              playingId === item.id 
                                ? 'bg-pink-600 text-white' 
                                : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                            }`}
                          >
                            {playingId === item.id ? (
                              <Pause size={14} className="md:w-4 md:h-4" />
                            ) : (
                              <Play size={14} className="md:w-4 md:h-4 ml-0.5" />
                            )}
                          </button>
                        )}
                        <span className="text-xs md:text-sm text-pink-600 font-medium">View →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-pink-100">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music size={24} className="md:w-8 md:h-8 text-pink-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No singles available</h3>
              <p className="text-sm md:text-base text-gray-500">Check back soon for new releases</p>
            </div>
          )
        ) : (
          albums.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {albums.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => openItemModal(item)}
                  className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                >
                  <div className="relative h-40 md:h-48 bg-gradient-to-br from-pink-100 to-pink-50">
                    {item.cover_url ? (
                      <Image 
                        src={item.cover_url} 
                        alt={item.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Headphones size={32} className="md:w-12 md:h-12 text-pink-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-1">{item.title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3">Album · {item.year}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg md:text-2xl font-bold text-pink-600">${item.price_usd}</span>
                      <span className="text-xs md:text-sm text-pink-600 font-medium">View Album →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-pink-100">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones size={24} className="md:w-8 md:h-8 text-pink-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No albums available</h3>
              <p className="text-sm md:text-base text-gray-500">Check back soon for new releases</p>
            </div>
          )
        )}
      </div>

      {/* Music Details Modal - Mobile Optimized */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl md:rounded-3xl shadow-2xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-3 md:p-6 rounded-t-xl md:rounded-t-3xl">
              <div className="flex items-start gap-2 md:gap-4">
                <div className="relative w-12 h-12 md:w-16 md:h-16 bg-pink-100 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0">
                  {selectedItem.cover_url ? (
                    <Image 
                      src={selectedItem.cover_url} 
                      alt={selectedItem.title} 
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {selectedItem.type === 'album' ? (
                        <Headphones size={20} className="md:w-6 md:h-6 text-pink-400" />
                      ) : (
                        <Music size={20} className="md:w-6 md:h-6 text-pink-400" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h2 className="text-base md:text-2xl font-bold text-gray-800 line-clamp-2">{selectedItem.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                      {selectedItem.type === 'album' ? 'Album' : 'Single'}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={10} className="md:w-3 md:h-3" />
                      {selectedItem.year}
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

            <div className="p-3 md:p-6">
              {/* Description */}
              {selectedItem.description && (
                <div className="mb-4 md:mb-6">
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{selectedItem.description}</p>
                </div>
              )}

              {/* Price */}
              <div className="bg-pink-50 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-600">Price</span>
                  <div className="text-right">
                    <span className="text-lg md:text-2xl font-bold text-pink-600">${selectedItem.price_usd}</span>
                    {selectedItem.price_ugx && (
                      <p className="text-xs text-gray-500">UGX {selectedItem.price_ugx.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                <button className="w-full bg-pink-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl font-medium hover:bg-pink-700 transition mt-2 md:mt-3 shadow-md text-sm md:text-base">
                  Buy Now
                </button>
              </div>

              {/* Album Songs - Only for albums */}
              {selectedItem.type === 'album' && albumSongs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-3 md:mb-4">Tracklist</h3>
                  <div className="space-y-1 md:space-y-2">
                    {albumSongs.map((song, index) => (
                      <div key={song.id} className="flex items-center justify-between p-2 md:p-3 bg-pink-50/50 rounded-lg md:rounded-xl hover:bg-pink-100/50 transition">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <span className="text-gray-400 text-xs md:text-sm w-4 md:w-6">{index + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 text-xs md:text-sm truncate">{song.title}</p>
                            {song.duration && (
                              <p className="text-xs text-gray-500">{song.duration}</p>
                            )}
                          </div>
                        </div>
                        {song.audio_url && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlay(song.audio_url, song.id, e)
                            }}
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              playingId === song.id 
                                ? 'bg-pink-600 text-white' 
                                : 'bg-white hover:bg-pink-600 hover:text-white'
                            }`}
                          >
                            {playingId === song.id ? (
                              <Pause size={10} className="md:w-3 md:h-3" />
                            ) : (
                              <Play size={10} className="md:w-3 md:h-3 ml-0.5" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />
    </div>
  )
}