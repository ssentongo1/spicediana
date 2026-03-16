'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload,
  Image as ImageIcon,
  Film,
  Code,
  Play,
  Check,
  X,
  Loader2,
  AlertCircle,
  Eye,
  MousePointer
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

interface Ad {
  id: number
  title: string
  description: string | null
  ad_type: 'image' | 'video' | 'adsense'
  media_url: string | null
  link_url: string | null
  adsense_code: string | null
  is_active: boolean
  clicks: number
  views: number
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Ad | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ad_type: 'image' as 'image' | 'video' | 'adsense',
    media_url: '',
    link_url: '',
    adsense_code: '',
    is_active: true
  })

  useEffect(() => {
    fetchAds()
  }, [])

  async function fetchAds() {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAds(data || [])
    } catch (error: any) {
      console.error('Error fetching ads:', error.message)
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
      const fileName = `ad_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `ads/${fileName}`

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
      alert('Upload failed: ' + error.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      setFormData({...formData, media_url: url})
    }
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.title) errors.title = 'Title is required'
    
    if (formData.ad_type === 'adsense') {
      if (!formData.adsense_code) errors.adsense_code = 'AdSense code is required'
    } else {
      if (!formData.media_url) errors.media_url = 'Media file is required'
      if (!formData.link_url) errors.link_url = 'Destination URL is required'
      if (!formData.link_url.startsWith('http')) errors.link_url = 'URL must start with http:// or https://'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveAd() {
    if (!validateForm()) return

    try {
      const adData = {
        title: formData.title,
        description: formData.description || null,
        ad_type: formData.ad_type,
        media_url: formData.media_url || null,
        link_url: formData.link_url || null,
        adsense_code: formData.adsense_code || null,
        is_active: formData.is_active,
        clicks: editingItem ? editingItem.clicks : 0,
        views: editingItem ? editingItem.views : 0
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('ads')
          .update(adData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('ads')
          .insert([adData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchAds()
      alert(editingItem ? 'Ad updated!' : 'Ad added!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function toggleActive(id: number, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !currentActive })
        .eq('id', id)

      if (error) throw error
      fetchAds()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteAd(id: number) {
    if (!confirm('Delete this ad?')) return

    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchAds()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      ad_type: 'image',
      media_url: '',
      link_url: '',
      adsense_code: '',
      is_active: true
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editAd(ad: Ad) {
    setFormData({
      title: ad.title,
      description: ad.description || '',
      ad_type: ad.ad_type,
      media_url: ad.media_url || '',
      link_url: ad.link_url || '',
      adsense_code: ad.adsense_code || '',
      is_active: ad.is_active
    })
    setEditingItem(ad)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-600 hover:text-pink-600">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              Ad Manager
            </h1>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Ad
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="p-6 border-b border-pink-100">
            <h2 className="font-semibold text-gray-800">Manage Ads</h2>
            <p className="text-sm text-gray-500 mt-1">Add image ads, video ads, or Google AdSense</p>
          </div>

          <div className="divide-y divide-pink-100">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 flex items-center justify-between hover:bg-pink-50/50 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${
                    ad.is_active ? 'bg-pink-100' : 'bg-gray-100'
                  }`}>
                    {ad.ad_type === 'image' && ad.media_url && (
                      <Image 
                        src={ad.media_url} 
                        alt={ad.title} 
                        width={48} 
                        height={48} 
                        className="object-cover"
                      />
                    )}
                    {ad.ad_type === 'video' && (
                      <Film size={24} className={ad.is_active ? 'text-pink-600' : 'text-gray-400'} />
                    )}
                    {ad.ad_type === 'adsense' && (
                      <Code size={24} className={ad.is_active ? 'text-pink-600' : 'text-gray-400'} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{ad.title}</h3>
                    <p className="text-xs text-gray-500">
                      {ad.ad_type} ad · {ad.clicks} clicks · {ad.views} views
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(ad.id, ad.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      ad.is_active 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {ad.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => editAd(ad)}
                    className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {ads.length === 0 && (
              <div className="p-12 text-center">
                <ImageIcon size={40} className="mx-auto text-pink-300 mb-3" />
                <p className="text-gray-500">No ads added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingItem ? 'Edit' : 'Add New'} Ad
            </h2>

            <div className="space-y-4">
              {/* Ad Type Selector - with visible labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, ad_type: 'image', media_url: '', adsense_code: ''})}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                      formData.ad_type === 'image'
                        ? 'border-pink-600 bg-pink-50'
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <ImageIcon size={20} className={formData.ad_type === 'image' ? 'text-pink-600' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${formData.ad_type === 'image' ? 'text-pink-600' : 'text-gray-700'}`}>
                      Image
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, ad_type: 'video', media_url: '', adsense_code: ''})}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                      formData.ad_type === 'video'
                        ? 'border-pink-600 bg-pink-50'
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <Film size={20} className={formData.ad_type === 'video' ? 'text-pink-600' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${formData.ad_type === 'video' ? 'text-pink-600' : 'text-gray-700'}`}>
                      Video
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, ad_type: 'adsense', media_url: '', link_url: ''})}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                      formData.ad_type === 'adsense'
                        ? 'border-pink-600 bg-pink-50'
                        : 'border-pink-100 hover:border-pink-300'
                    }`}
                  >
                    <Code size={20} className={formData.ad_type === 'adsense' ? 'text-pink-600' : 'text-gray-500'} />
                    <span className={`text-xs font-medium ${formData.ad_type === 'adsense' ? 'text-pink-600' : 'text-gray-700'}`}>
                      AdSense
                    </span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title</label>
                <input
                  type="text"
                  className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                    formErrors.title ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="e.g. Summer Sale, New Album, etc."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  className="w-full p-3 border border-pink-100 rounded-lg text-gray-800 bg-white"
                  rows={2}
                  placeholder="Short description of the ad..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Image/Video Upload */}
              {(formData.ad_type === 'image' || formData.ad_type === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.ad_type === 'image' ? 'Ad Image' : 'Ad Video'}
                  </label>
                  <div className="relative">
                    {formData.media_url ? (
                      <div className="relative w-full h-40 bg-pink-100 rounded-lg overflow-hidden group">
                        {formData.ad_type === 'image' ? (
                          <Image 
                            src={formData.media_url} 
                            alt="Ad preview" 
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <video 
                            src={formData.media_url} 
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            onClick={() => setFormData({...formData, media_url: ''})}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                          <label className="bg-white text-gray-700 p-2 rounded-full hover:bg-pink-50 transition cursor-pointer">
                            <Upload size={16} />
                            <input 
                              type="file"
                              accept={formData.ad_type === 'image' ? 'image/*' : 'video/*'}
                              onChange={handleMediaUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-pink-300 transition cursor-pointer block bg-pink-50/50">
                        <Upload size={24} className="mx-auto text-pink-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload {formData.ad_type}</p>
                        <p className="text-xs text-gray-400">
                          {formData.ad_type === 'image' 
                            ? 'PNG, JPG · Recommended: 1200×628 pixels' 
                            : 'MP4 up to 20MB'}
                        </p>
                        <input 
                          type="file"
                          accept={formData.ad_type === 'image' ? 'image/*' : 'video/*'}
                          onChange={handleMediaUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {formErrors.media_url && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {formErrors.media_url}
                    </p>
                  )}
                  {uploading && (
                    <div className="mt-2">
                      <div className="h-1 bg-pink-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300"
                          style={{width: `${uploadProgress}%`}}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}

              {/* AdSense Code */}
              {formData.ad_type === 'adsense' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google AdSense Code</label>
                  <textarea
                    className={`w-full p-3 border rounded-lg text-gray-800 bg-white font-mono text-sm ${
                      formErrors.adsense_code ? 'border-red-300 bg-red-50' : 'border-pink-100'
                    }`}
                    rows={4}
                    placeholder="Paste your AdSense code here..."
                    value={formData.adsense_code}
                    onChange={(e) => setFormData({...formData, adsense_code: e.target.value})}
                  />
                  {formErrors.adsense_code && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {formErrors.adsense_code}
                    </p>
                  )}
                </div>
              )}

              {/* Link URL (for image/video ads) */}
              {(formData.ad_type === 'image' || formData.ad_type === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
                  <input
                    type="url"
                    className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                      formErrors.link_url ? 'border-red-300 bg-red-50' : 'border-pink-100'
                    }`}
                    placeholder="https://..."
                    value={formData.link_url}
                    onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                  />
                  {formErrors.link_url && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {formErrors.link_url}
                    </p>
                  )}
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-pink-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active (visible on site)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveAd}
                  disabled={uploading}
                  className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50"
                >
                  {editingItem ? 'Update' : 'Add'} Ad
                </button>
                <button
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
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