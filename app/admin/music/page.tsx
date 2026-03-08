'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Music, 
  Headphones,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useState, useEffect } from 'react'
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
  title: string
  duration: string
  audio_url: string
}

interface FormData {
  title: string
  price_usd: string
  price_ugx: string
  year: string
  type: 'single' | 'album'
  cover_url: string
  description: string
}

export default function AdminMusicPage() {
  // State
  const [activeTab, setActiveTab] = useState<'singles' | 'albums'>('singles')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MusicItem | null>(null)
  const [singles, setSingles] = useState<MusicItem[]>([])
  const [albums, setAlbums] = useState<MusicItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    price_usd: '',
    price_ugx: '',
    year: new Date().getFullYear().toString(),
    type: 'single',
    cover_url: '',
    description: ''
  })

  // Album songs
  const [albumSongs, setAlbumSongs] = useState<Song[]>([])
  const [currentSong, setCurrentSong] = useState<Song>({
    title: '',
    duration: '',
    audio_url: ''
  })

  // ==================== DATA FETCHING ====================
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

  // ==================== FILE UPLOAD ====================
  async function uploadFile(file: File, folder: string): Promise<string | null> {
    if (!file) return null

    setUploading(true)
    setUploadProgress(0)
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file)

      clearInterval(progressInterval)
      
      if (uploadError) {
        throw uploadError
      }

      setUploadProgress(100)
      setTimeout(() => setUploadProgress(0), 500)

      const { data } = supabase.storage
        .from('music')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error: any) {
      clearInterval(progressInterval)
      alert('Upload failed: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  // ==================== FORM HANDLERS ====================
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file, 'covers')
    if (url) {
      setFormData({...formData, cover_url: url})
      setFormErrors({...formErrors, cover: ''})
    }
  }

  async function handleSingleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file, 'audio')
    if (url) {
      // Save the single WITH the audio URL
      await saveSingle(url)
    }
  }

  async function handleSongAudioUpload(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file, 'audio')
    if (url) {
      const updated = [...albumSongs]
      updated[index].audio_url = url
      setAlbumSongs(updated)
    }
  }

  // ==================== VALIDATION ====================
  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.price_usd) errors.price_usd = 'Price is required'
    if (parseFloat(formData.price_usd) <= 0) errors.price_usd = 'Price must be greater than 0'
    if (!formData.year) errors.year = 'Year is required'
    
    if (formData.type === 'album') {
      if (albumSongs.length === 0) errors.songs = 'Add at least one song'
      const missingAudio = albumSongs.some(s => !s.audio_url)
      if (missingAudio) errors.songs = 'All songs must have audio'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ==================== SAVE OPERATIONS ====================
  async function saveSingle(audioUrl: string) {
    if (!validateForm()) return

    try {
      const musicData = {
        title: formData.title,
        price_usd: parseFloat(formData.price_usd),
        price_ugx: formData.price_ugx ? parseInt(formData.price_ugx) : null,
        year: formData.year,
        type: 'single',
        cover_url: formData.cover_url || null,
        description: formData.description || null,
        audio_url: audioUrl // This line saves the audio URL to the database
      }

      const { error } = await supabase
        .from('music')
        .insert([musicData])

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchMusic()
      alert('Single added successfully with audio!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function saveAlbum() {
    if (!validateForm()) return

    try {
      // Insert album
      const { data, error } = await supabase
        .from('music')
        .insert([{
          title: formData.title,
          price_usd: parseFloat(formData.price_usd),
          price_ugx: formData.price_ugx ? parseInt(formData.price_ugx) : null,
          year: formData.year,
          type: 'album',
          cover_url: formData.cover_url || null,
          description: formData.description || null
        }])
        .select()

      if (error) throw error

      // Insert songs
      const albumId = data[0].id
      const songsToInsert = albumSongs.map((song, i) => ({
        album_id: albumId,
        title: song.title,
        audio_url: song.audio_url,
        duration: song.duration,
        track_number: i + 1
      }))

      const { error: songsError } = await supabase
        .from('songs')
        .insert(songsToInsert)

      if (songsError) throw songsError

      setShowForm(false)
      resetForm()
      fetchMusic()
      alert('Album added successfully!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteItem(id: number, type: string) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      const { error } = await supabase
        .from('music')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchMusic()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  // ==================== SONG MANAGEMENT ====================
  function addSongToAlbum() {
    if (!currentSong.title) {
      alert('Enter song title')
      return
    }
    if (!currentSong.audio_url) {
      alert('Upload audio for this song')
      return
    }
    setAlbumSongs([...albumSongs, currentSong])
    setCurrentSong({ title: '', duration: '', audio_url: '' })
  }

  function removeSongFromAlbum(index: number) {
    setAlbumSongs(albumSongs.filter((_, i) => i !== index))
  }

  // ==================== RESET FORM ====================
  function resetForm() {
    setFormData({
      title: '',
      price_usd: '',
      price_ugx: '',
      year: new Date().getFullYear().toString(),
      type: 'single',
      cover_url: '',
      description: ''
    })
    setAlbumSongs([])
    setCurrentSong({ title: '', duration: '', audio_url: '' })
    setEditingItem(null)
    setFormErrors({})
  }

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your music library...</p>
        </div>
      </div>
    )
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                Music Manager
              </h1>
              <p className="text-sm text-gray-500">Manage your singles and albums</p>
            </div>
          </div>
          <button 
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-200 transition-all duration-300 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>New Release</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Singles</p>
                <p className="text-3xl font-bold text-gray-800">{singles.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Music className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Albums</p>
                <p className="text-3xl font-bold text-gray-800">{albums.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Headphones className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
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

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'singles' ? (
          singles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {singles.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48 bg-gradient-to-br from-pink-100 to-pink-50">
                    {item.cover_url ? (
                      <Image 
                        src={item.cover_url} 
                        alt={item.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={48} className="text-pink-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{item.year}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition">
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteItem(item.id, 'single')}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-pink-600">${item.price_usd}</span>
                        {item.price_ugx && (
                          <span className="text-sm text-gray-400">/ UGX {item.price_ugx.toLocaleString()}</span>
                        )}
                      </div>
                      {item.audio_url && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                          <Check size={12} />
                          Audio ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-pink-100">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music size={32} className="text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No singles yet</h3>
              <p className="text-gray-500 mb-6">Start by adding your first single</p>
              <button 
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Add Your First Single
              </button>
            </div>
          )
        ) : (
          albums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48 bg-gradient-to-br from-pink-100 to-pink-50">
                    {item.cover_url ? (
                      <Image 
                        src={item.cover_url} 
                        alt={item.title} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Headphones size={48} className="text-pink-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">Album · {item.year}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition">
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => deleteItem(item.id, 'album')}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-bold text-pink-600">${item.price_usd}</span>
                      {item.price_ugx && (
                        <span className="text-sm text-gray-400">UGX {item.price_ugx.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 text-center border border-pink-100">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones size={32} className="text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No albums yet</h3>
              <p className="text-gray-500 mb-6">Create your first album</p>
              <button 
                onClick={() => {
                  setFormData({...formData, type: 'album'})
                  setShowForm(true)
                }}
                className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Create First Album
              </button>
            </div>
          )
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                  {editingItem ? 'Edit' : 'Add New'} {formData.type === 'single' ? 'Single' : 'Album'}
                </h2>
                <button 
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="w-10 h-10 rounded-full hover:bg-pink-50 flex items-center justify-center transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Type Selector */}
              <div className="bg-pink-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Release Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormData({...formData, type: 'single'})}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      formData.type === 'single'
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-pink-100'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setFormData({...formData, type: 'album'})}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      formData.type === 'album'
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-pink-100'
                    }`}
                  >
                    Album
                  </button>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div className="relative">
                  {formData.cover_url ? (
                    <div className="relative w-full h-64 bg-pink-100 rounded-2xl overflow-hidden group">
                      <Image 
                        src={formData.cover_url} 
                        alt="Cover" 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setFormData({...formData, cover_url: ''})}
                          className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition"
                        >
                          <Trash2 size={20} />
                        </button>
                        <label className="bg-white text-gray-700 p-3 rounded-full hover:bg-pink-50 transition cursor-pointer">
                          <Upload size={20} />
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="border-3 border-dashed border-pink-200 rounded-2xl p-12 text-center hover:border-pink-300 transition cursor-pointer block bg-pink-50/50">
                      <ImageIcon size={48} className="mx-auto text-pink-300 mb-3" />
                      <p className="text-gray-600 font-medium mb-1">Click to upload cover image</p>
                      <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {uploading && (
                  <div className="mt-3">
                    <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300"
                        style={{width: `${uploadProgress}%`}}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.title ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. Sitya Loss"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea 
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                  placeholder="Write a short description..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD)</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="number"
                      step="0.01"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                        formErrors.price_usd ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                      }`}
                      placeholder="1.99"
                      value={formData.price_usd}
                      onChange={(e) => setFormData({...formData, price_usd: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (UGX) - Optional</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                    placeholder="5000"
                    value={formData.price_ugx}
                    onChange={(e) => setFormData({...formData, price_ugx: e.target.value})}
                  />
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input 
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                      formErrors.year ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                    }`}
                    placeholder="2024"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  />
                </div>
              </div>

              {/* SINGLE: Audio Upload */}
              {formData.type === 'single' && (
                <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border-2 border-pink-100">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Upload Song Audio</label>
                  <div className="relative">
                    <label className="border-3 border-dashed border-pink-200 rounded-2xl p-8 text-center hover:border-pink-300 transition cursor-pointer block">
                      <Headphones size={40} className="mx-auto text-pink-300 mb-3" />
                      <p className="text-gray-600 font-medium mb-1">Click to select audio file</p>
                      <p className="text-sm text-gray-400">MP3, WAV (max 20MB)</p>
                      <input 
                        type="file"
                        accept="audio/*"
                        onChange={handleSingleAudioUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploading && (
                    <p className="text-sm text-pink-600 mt-2 text-center">Uploading audio...</p>
                  )}
                </div>
              )}

              {/* ALBUM: Songs */}
              {formData.type === 'album' && (
                <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-2xl border-2 border-pink-100">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Album Songs</label>
                  
                  {/* Add Song Form */}
                  <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                    <input 
                      type="text"
                      placeholder="Song title"
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl mb-3 focus:outline-none focus:border-pink-300 text-gray-800 bg-white"
                      value={currentSong.title}
                      onChange={(e) => setCurrentSong({...currentSong, title: e.target.value})}
                    />
                    
                    <input 
                      type="text"
                      placeholder="Duration (e.g. 3:45)"
                      className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl mb-3 focus:outline-none focus:border-pink-300 text-gray-800 bg-white"
                      value={currentSong.duration}
                      onChange={(e) => setCurrentSong({...currentSong, duration: e.target.value})}
                    />

                    {/* Audio Upload for this song */}
                    <div className="relative mb-3">
                      <label className="border-2 border-dashed border-pink-200 rounded-xl p-4 text-center hover:border-pink-300 transition cursor-pointer block">
                        {currentSong.audio_url ? (
                          <div className="text-green-600">
                            <Check size={24} className="mx-auto mb-2" />
                            <p className="text-sm font-medium">Audio ready</p>
                            <p className="text-xs">Click to change</p>
                          </div>
                        ) : (
                          <>
                            <Headphones size={24} className="mx-auto text-pink-300 mb-2" />
                            <p className="text-sm text-gray-600">Click to upload audio for this song</p>
                          </>
                        )}
                        <input 
                          type="file"
                          accept="audio/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const url = await uploadFile(file, 'audio')
                              if (url) setCurrentSong({...currentSong, audio_url: url})
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <button 
                      onClick={addSongToAlbum}
                      className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      Add Song to Album
                    </button>
                  </div>

                  {/* Songs List */}
                  {albumSongs.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Songs ({albumSongs.length})</h4>
                      {albumSongs.map((song, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-pink-100">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{song.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-gray-500">{song.duration}</span>
                              {song.audio_url && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                                  Audio ✓
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <label className="w-8 h-8 rounded-full hover:bg-pink-50 flex items-center justify-center cursor-pointer">
                              <Upload size={16} className="text-gray-500" />
                              <input 
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleSongAudioUpload(e, index)}
                                className="hidden"
                              />
                            </label>
                            <button 
                              onClick={() => removeSongFromAlbum(index)}
                              className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formErrors.songs && (
                    <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.songs}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-pink-100">
                <button 
                  onClick={formData.type === 'single' ? undefined : saveAlbum}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      {editingItem ? 'Update' : 'Publish'} {formData.type === 'single' ? 'Single' : 'Album'}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="flex-1 border-2 border-pink-200 text-gray-700 py-3.5 rounded-xl font-medium hover:bg-pink-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}