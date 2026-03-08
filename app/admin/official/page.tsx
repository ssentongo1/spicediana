'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Megaphone,
  AlertCircle,
  Calendar,
  X,
  Check,
  Loader2,
  AlertTriangle
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
}

interface FormData {
  title: string
  content: string
  type: 'music' | 'business' | 'foundation' | 'urgent' | 'general'
  date: string
  urgent: boolean
}

export default function AdminOfficialPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    type: 'general',
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    urgent: false
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    setLoading(true)
    try {
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

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.content.trim()) errors.content = 'Content is required'
    if (!formData.date.trim()) errors.date = 'Date is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveAnnouncement() {
    if (!validateForm()) return

    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        date: formData.date,
        urgent: formData.urgent
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('announcements')
          .update(announcementData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('announcements')
          .insert([announcementData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchAnnouncements()
      alert(editingItem ? 'Announcement updated!' : 'Announcement published!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteAnnouncement(id: number) {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAnnouncements()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      urgent: false
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editAnnouncement(item: Announcement) {
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      date: item.date,
      urgent: item.urgent
    })
    setEditingItem(item)
    setShowForm(true)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                Official Announcements
              </h1>
              <p className="text-sm text-gray-500">Share important news with fans</p>
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
            <span>New Announcement</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-3xl font-bold text-gray-800">{announcements.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Megaphone className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Urgent</p>
                <p className="text-3xl font-bold text-gray-800">
                  {announcements.filter(a => a.urgent).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-3xl font-bold text-gray-800">
                  {announcements.filter(a => {
                    const today = new Date()
                    const itemDate = new Date(a.date)
                    return itemDate.getMonth() === today.getMonth() && 
                           itemDate.getFullYear() === today.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-4xl mx-auto px-4">
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-all ${
                  item.urgent ? 'border-red-200' : 'border-pink-100'
                }`}
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Type Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                        {item.type.toUpperCase()}
                      </span>
                      
                      {/* Urgent Badge */}
                      {item.urgent && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <AlertCircle size={12} />
                          URGENT
                        </span>
                      )}

                      {/* Date */}
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Calendar size={14} />
                        {item.date}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => editAnnouncement(item)}
                        className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteAnnouncement(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h2>
                  
                  {/* Content */}
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-pink-100">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No announcements yet</h3>
            <p className="text-gray-500 mb-6">Create your first official announcement</p>
            <button 
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create First Announcement
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
                  {editingItem ? 'Edit' : 'New'} Announcement
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
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.title ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. New Album Announcement"
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

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea 
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.content ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="Write your announcement here..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={6}
                />
                {formErrors.content && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.content}
                  </p>
                )}
              </div>

              {/* Type and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="general">General</option>
                    <option value="music">Music</option>
                    <option value="business">Business</option>
                    <option value="foundation">Foundation</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input 
                    type="text"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                      formErrors.date ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                    }`}
                    placeholder="March 15, 2024"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              {/* Urgent Toggle */}
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                <input 
                  type="checkbox"
                  id="urgent"
                  className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-200"
                  checked={formData.urgent}
                  onChange={(e) => setFormData({...formData, urgent: e.target.checked})}
                />
                <label htmlFor="urgent" className="text-sm text-gray-700">
                  Mark as urgent <span className="text-red-500">(will show with red alert)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-pink-100">
                <button 
                  onClick={saveAnnouncement}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3.5 rounded-xl font-medium hover:shadow-lg hover:shadow-pink-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {editingItem ? 'Update Announcement' : 'Publish Announcement'}
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