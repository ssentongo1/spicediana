'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Star,
  Music,
  ShoppingBag,
  Calendar,
  Newspaper,
  Mic2,
  Briefcase,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface FeaturedPost {
  id: number
  position: 1 | 2 | 3
  page_type: 'music' | 'shop' | 'events' | 'blog' | 'official' | 'brands'
  item_id: number
  item_data: any
  created_at: string
  updated_at: string
}

interface SearchResult {
  id: number
  title: string
  image_url: string | null
  description: string
  type: string
}

export default function AdminFeaturedPage() {
  const [featured, setFeatured] = useState<FeaturedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPosition, setEditingPosition] = useState<1 | 2 | 3 | null>(null)
  const [searchType, setSearchType] = useState<'music' | 'shop' | 'events' | 'blog' | 'official' | 'brands'>('music')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null)

  // Icons for each page type
  const pageIcons = {
    music: Music,
    shop: ShoppingBag,
    events: Calendar,
    blog: Newspaper,
    official: Mic2,
    brands: Briefcase
  }

  useEffect(() => {
    fetchFeatured()
  }, [])

  async function fetchFeatured() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('featured_posts')
        .select('*')
        .order('position', { ascending: true })

      if (error) throw error
      setFeatured(data || [])
    } catch (error: any) {
      console.error('Error fetching featured:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function searchItems() {
    setSearching(true)
    try {
      let query
      switch (searchType) {
        case 'music':
          query = supabase.from('music').select('id, title, cover_url, description')
          break
        case 'shop':
          query = supabase.from('products').select('id, name, image_url, caption')
          break
        case 'events':
          query = supabase.from('events').select('id, title, image_url, description')
          break
        case 'blog':
          query = supabase.from('blog_posts').select('id, title, image_url, excerpt')
          break
        case 'official':
          query = supabase.from('announcements').select('id, title, content')
          break
        case 'brands':
          query = supabase.from('brands').select('id, brand_name, image_url, caption')
          break
      }

      const { data, error } = await query?.order('created_at', { ascending: false }).limit(20)

      if (error) throw error

      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || item.name || item.brand_name,
        image_url: item.cover_url || item.image_url || null,
        description: item.description || item.caption || item.excerpt || item.content || '',
        type: searchType
      }))

      setSearchResults(formatted)
    } catch (error: any) {
      console.error('Error searching:', error.message)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    if (showForm) {
      searchItems()
    }
  }, [searchType, showForm])

  async function saveFeatured() {
    if (!selectedItem || !editingPosition) return

    try {
      const featuredData = {
        position: editingPosition,
        page_type: searchType,
        item_id: selectedItem.id,
        item_data: selectedItem
      }

      // Check if position already exists
      const existing = featured.find(f => f.position === editingPosition)
      
      let error
      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('featured_posts')
          .update(featuredData)
          .eq('position', editingPosition)
        error = updateError
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('featured_posts')
          .insert([featuredData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      setSelectedItem(null)
      setEditingPosition(null)
      fetchFeatured()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteFeatured(position: number) {
    if (!confirm(`Remove featured item from position ${position}?`)) return

    try {
      const { error } = await supabase
        .from('featured_posts')
        .delete()
        .eq('position', position)

      if (error) throw error
      fetchFeatured()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function getPageIcon(type: string) {
    const Icon = pageIcons[type as keyof typeof pageIcons]
    return Icon ? <Icon size={16} /> : <Star size={16} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading featured content...</p>
        </div>
      </div>
    )
  }

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
                Featured Content
              </h1>
              <p className="text-sm text-gray-500">Choose what appears on the home page</p>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((position) => {
            const item = featured.find(f => f.position === position)
            const Icon = item ? pageIcons[item.page_type] : Star

            return (
              <div key={position} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-pink-50 to-white border-b border-pink-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                        <Star size={14} className="text-pink-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">Position {position}</h3>
                    </div>
                    {item ? (
                      <button
                        onClick={() => deleteFeatured(position)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPosition(position as 1 | 2 | 3)
                          setSelectedItem(null)
                          setShowForm(true)
                        }}
                        className="text-pink-600 hover:text-pink-700 p-1"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {item ? (
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 bg-pink-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.item_data?.image_url ? (
                          <Image
                            src={item.item_data.image_url}
                            alt={item.item_data.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon size={20} className="text-pink-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Icon size={12} className="text-pink-600" />
                          <span className="text-xs text-pink-600 capitalize">{item.page_type}</span>
                        </div>
                        <h4 className="font-medium text-gray-800 text-sm line-clamp-2">
                          {item.item_data?.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-400">No featured item</p>
                    <p className="text-xs text-gray-300 mt-1">Click + to add</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                  Feature Item - Position {editingPosition}
                </h2>
                <button 
                  onClick={() => {
                    setShowForm(false)
                    setSelectedItem(null)
                    setEditingPosition(null)
                  }}
                  className="w-10 h-10 rounded-full hover:bg-pink-50 flex items-center justify-center transition"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Page Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Page</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['music', 'shop', 'events', 'blog', 'official', 'brands'] as const).map((type) => {
                    const Icon = pageIcons[type]
                    return (
                      <button
                        key={type}
                        onClick={() => setSearchType(type)}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                          searchType === type
                            ? 'border-pink-600 bg-pink-50'
                            : 'border-pink-100 hover:border-pink-300'
                        }`}
                      >
                        <Icon size={20} className={searchType === type ? 'text-pink-600' : 'text-gray-400'} />
                        <span className="text-xs capitalize">{type}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Search Results */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Item</label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searching ? (
                    <div className="text-center py-8">
                      <Loader2 size={24} className="animate-spin text-pink-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Searching...</p>
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full p-3 rounded-xl border-2 flex items-start gap-3 transition ${
                          selectedItem?.id === item.id && selectedItem?.type === searchType
                            ? 'border-pink-600 bg-pink-50'
                            : 'border-pink-100 hover:border-pink-300'
                        }`}
                      >
                        <div className="relative w-12 h-12 bg-pink-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getPageIcon(searchType)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-medium text-gray-800 text-sm line-clamp-2">{item.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-pink-100">
                <button 
                  onClick={saveFeatured}
                  disabled={!selectedItem}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Feature This Item
                </button>
                <button 
                  onClick={() => {
                    setShowForm(false)
                    setSelectedItem(null)
                    setEditingPosition(null)
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