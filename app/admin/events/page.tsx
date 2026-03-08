'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Calendar,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Loader2,
  Ticket
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Event {
  id: number
  title: string
  date: string
  venue: string
  city: string
  price: number | null
  price_usd: number | null
  price_ugx: number | null
  description: string | null
  image_url: string | null
  status: 'upcoming' | 'past'
  ticket_link: string | null
  created_at: string
}

interface FormData {
  title: string
  date: string
  venue: string
  city: string
  price_usd: string
  price_ugx: string
  description: string
  image_url: string
  status: 'upcoming' | 'past'
  ticket_link: string
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Event | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    date: '',
    venue: '',
    city: '',
    price_usd: '',
    price_ugx: '',
    description: '',
    image_url: '',
    status: 'upcoming',
    ticket_link: ''
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error: any) {
      console.error('Error fetching events:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File): Promise<string | null> {
    if (!file) return null

    setUploading(true)
    setUploadProgress(0)
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `event_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `events/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(filePath, file)

      clearInterval(progressInterval)
      
      if (uploadError) throw uploadError

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      setFormData({...formData, image_url: url})
    }
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.title.trim()) errors.title = 'Event title is required'
    if (!formData.date.trim()) errors.date = 'Date is required'
    if (!formData.venue.trim()) errors.venue = 'Venue is required'
    if (!formData.city.trim()) errors.city = 'City is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveEvent() {
    if (!validateForm()) return

    try {
      const priceUsdValue = formData.price_usd ? parseFloat(formData.price_usd) : null
      const priceUgxValue = formData.price_ugx ? parseInt(formData.price_ugx) : null

      const eventData = {
        title: formData.title,
        date: formData.date,
        venue: formData.venue,
        city: formData.city,
        price: priceUsdValue, // For backward compatibility
        price_usd: priceUsdValue,
        price_ugx: priceUgxValue,
        description: formData.description || null,
        image_url: formData.image_url || null,
        status: formData.status,
        ticket_link: formData.ticket_link || null
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('events')
          .insert([eventData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchEvents()
      alert(editingItem ? 'Event updated successfully!' : 'Event added successfully!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteEvent(id: number) {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchEvents()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      date: '',
      venue: '',
      city: '',
      price_usd: '',
      price_ugx: '',
      description: '',
      image_url: '',
      status: 'upcoming',
      ticket_link: ''
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editEvent(event: Event) {
    setFormData({
      title: event.title,
      date: event.date,
      venue: event.venue,
      city: event.city,
      price_usd: event.price_usd?.toString() || '',
      price_ugx: event.price_ugx?.toString() || '',
      description: event.description || '',
      image_url: event.image_url || '',
      status: event.status,
      ticket_link: event.ticket_link || ''
    })
    setEditingItem(event)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading events...</p>
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
                Event Manager
              </h1>
              <p className="text-sm text-gray-500">Manage your shows and tour dates</p>
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
            <span>New Event</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-3xl font-bold text-gray-800">{events.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-3xl font-bold text-gray-800">
                  {events.filter(e => e.status === 'upcoming').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Check className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Past Events</p>
                <p className="text-3xl font-bold text-gray-800">
                  {events.filter(e => e.status === 'past').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-br from-pink-100 to-pink-50">
                  {event.image_url ? (
                    <Image 
                      src={event.image_url} 
                      alt={event.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar size={48} className="text-pink-300" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'upcoming' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                    </span>
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg">{event.title}</h3>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => editEvent(event)}
                        className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={14} className="mr-2 text-pink-400" />
                      {event.date}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={14} className="mr-2 text-pink-400" />
                      {event.venue}, {event.city}
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-pink-100">
                    <div>
                      {event.price_usd ? (
                        <span className="text-lg font-bold text-pink-600">${event.price_usd}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Free Entry</span>
                      )}
                      {event.price_ugx && (
                        <p className="text-xs text-gray-400">UGX {event.price_ugx.toLocaleString()}</p>
                      )}
                    </div>
                    {event.ticket_link && (
                      <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full flex items-center gap-1">
                        <Ticket size={12} />
                        Ticket Link
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
              <Calendar size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-6">Add your first event to start selling tickets</p>
            <button 
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Your First Event
            </button>
          </div>
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
                  {editingItem ? 'Edit' : 'Add New'} Event
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
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Poster</label>
                <div className="relative">
                  {formData.image_url ? (
                    <div className="relative w-full h-64 bg-pink-100 rounded-2xl overflow-hidden group">
                      <Image 
                        src={formData.image_url} 
                        alt="Event" 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setFormData({...formData, image_url: ''})}
                          className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition"
                        >
                          <Trash2 size={20} />
                        </button>
                        <label className="bg-white text-gray-700 p-3 rounded-full hover:bg-pink-50 transition cursor-pointer">
                          <Upload size={20} />
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="border-3 border-dashed border-pink-200 rounded-2xl p-12 text-center hover:border-pink-300 transition cursor-pointer block bg-pink-50/50">
                      <ImageIcon size={48} className="mx-auto text-pink-300 mb-3" />
                      <p className="text-gray-600 font-medium mb-1">Click to upload event poster</p>
                      <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
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

              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.title ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. Lugogo Show 2024"
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

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.date ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. June 15, 2024"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
                {formErrors.date && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.date}
                  </p>
                )}
              </div>

              {/* Venue and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <input 
                    type="text"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                      formErrors.venue ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                    }`}
                    placeholder="e.g. Cricket Oval"
                    value={formData.venue}
                    onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input 
                    type="text"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                      formErrors.city ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                    }`}
                    placeholder="e.g. Kampala"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                  placeholder="Event details, special guests, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD) - Optional</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                      placeholder="25.00"
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
                    placeholder="75000"
                    value={formData.price_ugx}
                    onChange={(e) => setFormData({...formData, price_ugx: e.target.value})}
                  />
                </div>
              </div>

              {/* Ticket Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Link (Optional)</label>
                <input 
                  type="url"
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                  placeholder="https://tickets.com/event"
                  value={formData.ticket_link}
                  onChange={(e) => setFormData({...formData, ticket_link: e.target.value})}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'upcoming' | 'past'})}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past Event</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-pink-100">
                <button 
                  onClick={saveEvent}
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
                      {editingItem ? 'Update Event' : 'Add Event'}
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