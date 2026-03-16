'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  MoveUp,
  MoveDown,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  AlertCircle,
  Music2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

interface StreamingPlatform {
  id: number
  name: string
  url: string
  image_url: string | null
  is_active: boolean
  display_order: number
}

export default function AdminStreamingPage() {
  const [platforms, setPlatforms] = useState<StreamingPlatform[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<StreamingPlatform | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    image_url: '',
    is_active: true
  })

  useEffect(() => {
    fetchPlatforms()
  }, [])

  async function fetchPlatforms() {
    try {
      const { data, error } = await supabase
        .from('streaming_platforms')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setPlatforms(data || [])
    } catch (error: any) {
      console.error('Error fetching platforms:', error.message)
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
      const fileName = `streaming_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `streaming/${fileName}`

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadFile(file)
    if (url) {
      setFormData({...formData, image_url: url})
    }
  }

  async function movePlatform(id: number, direction: 'up' | 'down') {
    const currentIndex = platforms.findIndex(p => p.id === id)
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === platforms.length - 1)
    ) return

    const newPlatforms = [...platforms]
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    const tempOrder = newPlatforms[currentIndex].display_order
    newPlatforms[currentIndex].display_order = newPlatforms[swapIndex].display_order
    newPlatforms[swapIndex].display_order = tempOrder

    ;[newPlatforms[currentIndex], newPlatforms[swapIndex]] = [newPlatforms[swapIndex], newPlatforms[currentIndex]]

    setPlatforms(newPlatforms)

    await supabase
      .from('streaming_platforms')
      .update({ display_order: newPlatforms[currentIndex].display_order })
      .eq('id', newPlatforms[currentIndex].id)

    await supabase
      .from('streaming_platforms')
      .update({ display_order: newPlatforms[swapIndex].display_order })
      .eq('id', newPlatforms[swapIndex].id)
  }

  function validateForm(): boolean {
    const errors: {[key: string]: string} = {}
    
    if (!formData.name) errors.name = 'Platform name is required'
    if (!formData.url) errors.url = 'URL is required'
    if (!formData.url.startsWith('http')) errors.url = 'URL must start with http:// or https://'
    if (!formData.image_url) errors.image_url = 'Platform logo is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function savePlatform() {
    if (!validateForm()) return

    try {
      const maxOrder = platforms.length > 0 ? Math.max(...platforms.map(p => p.display_order)) : 0
      const platformData = {
        name: formData.name,
        url: formData.url,
        image_url: formData.image_url,
        is_active: formData.is_active,
        display_order: editingItem ? editingItem.display_order : maxOrder + 1
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('streaming_platforms')
          .update(platformData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('streaming_platforms')
          .insert([platformData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchPlatforms()
      alert(editingItem ? 'Platform updated!' : 'Platform added!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function toggleActive(id: number, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('streaming_platforms')
        .update({ is_active: !currentActive })
        .eq('id', id)

      if (error) throw error
      fetchPlatforms()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deletePlatform(id: number) {
    if (!confirm('Delete this platform?')) return

    try {
      const { error } = await supabase
        .from('streaming_platforms')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPlatforms()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      url: '',
      image_url: '',
      is_active: true
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editPlatform(platform: StreamingPlatform) {
    setFormData({
      name: platform.name,
      url: platform.url,
      image_url: platform.image_url || '',
      is_active: platform.is_active
    })
    setEditingItem(platform)
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
              Streaming Platforms
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
            Add Platform
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden">
          <div className="p-6 border-b border-pink-100">
            <h2 className="font-semibold text-gray-800">Manage Streaming Platforms</h2>
            <p className="text-sm text-gray-500 mt-1">Add platforms where fans can stream music</p>
          </div>

          <div className="divide-y divide-pink-100">
            {platforms.map((platform) => (
              <div key={platform.id} className="p-4 flex items-center justify-between hover:bg-pink-50/50 transition">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => movePlatform(platform.id, 'up')}
                      className="text-gray-400 hover:text-pink-600 transition"
                      disabled={platforms.indexOf(platform) === 0}
                    >
                      <MoveUp size={16} />
                    </button>
                    <button
                      onClick={() => movePlatform(platform.id, 'down')}
                      className="text-gray-400 hover:text-pink-600 transition"
                      disabled={platforms.indexOf(platform) === platforms.length - 1}
                    >
                      <MoveDown size={16} />
                    </button>
                  </div>
                  <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                    platform.is_active ? 'bg-pink-100' : 'bg-gray-100'
                  }`}>
                    {platform.image_url ? (
                      <Image 
                        src={platform.image_url} 
                        alt={platform.name} 
                        width={40} 
                        height={40} 
                        className="object-cover"
                      />
                    ) : (
                      <Music2 size={20} className={platform.is_active ? 'text-pink-600' : 'text-gray-400'} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">{platform.name}</h3>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{platform.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(platform.id, platform.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      platform.is_active 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {platform.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => editPlatform(platform)}
                    className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deletePlatform(platform.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {platforms.length === 0 && (
              <div className="p-12 text-center">
                <Music2 size={40} className="mx-auto text-pink-300 mb-3" />
                <p className="text-gray-500">No streaming platforms added yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingItem ? 'Edit' : 'Add'} Streaming Platform
            </h2>

            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Logo</label>
                <div className="relative">
                  {formData.image_url ? (
                    <div className="relative w-full h-32 bg-pink-100 rounded-lg overflow-hidden group">
                      <Image 
                        src={formData.image_url} 
                        alt="Platform logo" 
                        fill
                        className="object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => setFormData({...formData, image_url: ''})}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                        <label className="bg-white text-gray-700 p-2 rounded-full hover:bg-pink-50 transition cursor-pointer">
                          <Upload size={16} />
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
                    <label className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center hover:border-pink-300 transition cursor-pointer block bg-pink-50/50">
                      <Upload size={24} className="mx-auto text-pink-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload logo</p>
                      <p className="text-xs text-gray-400">PNG, JPG (recommended: 200x200px)</p>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {formErrors.image_url && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.image_url}
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

              {/* Platform Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                <input
                  type="text"
                  className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                    formErrors.name ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="e.g. Spotify"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  className={`w-full p-3 border rounded-lg text-gray-800 bg-white ${
                    formErrors.url ? 'border-red-300 bg-red-50' : 'border-pink-100'
                  }`}
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
                {formErrors.url && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {formErrors.url}
                  </p>
                )}
              </div>

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
                  onClick={savePlatform}
                  disabled={uploading}
                  className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 transition disabled:opacity-50"
                >
                  {editingItem ? 'Update' : 'Add'} Platform
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