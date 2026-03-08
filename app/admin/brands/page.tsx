'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Briefcase,
  ExternalLink,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Loader2,
  Star
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Brand {
  id: number
  brand_name: string
  category: string
  caption: string
  partnership: string
  link: string
  image_url: string | null
  time_ago: string | null
  created_at: string
}

interface FormData {
  brand_name: string
  category: string
  caption: string
  partnership: string
  link: string
  image_url: string
  time_ago: string
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Brand | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // Form state
  const [formData, setFormData] = useState<FormData>({
    brand_name: '',
    category: '',
    caption: '',
    partnership: '',
    link: '',
    image_url: '',
    time_ago: 'Just now'
  })

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBrands(data || [])
    } catch (error: any) {
      console.error('Error fetching brands:', error.message)
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
      const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `brands/${fileName}`

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
    
    if (!formData.brand_name.trim()) errors.brand_name = 'Brand name is required'
    if (!formData.category.trim()) errors.category = 'Category is required'
    if (!formData.caption.trim()) errors.caption = 'Caption is required'
    if (!formData.partnership.trim()) errors.partnership = 'Partnership description is required'
    if (!formData.link.trim()) errors.link = 'Website link is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveBrand() {
    if (!validateForm()) return

    try {
      const brandData = {
        brand_name: formData.brand_name,
        category: formData.category,
        caption: formData.caption,
        partnership: formData.partnership,
        link: formData.link,
        image_url: formData.image_url || null,
        time_ago: formData.time_ago
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('brands')
          .update(brandData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('brands')
          .insert([brandData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchBrands()
      alert(editingItem ? 'Brand updated!' : 'Brand added!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteBrand(id: number) {
    if (!confirm('Are you sure you want to remove this brand?')) return

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchBrands()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      brand_name: '',
      category: '',
      caption: '',
      partnership: '',
      link: '',
      image_url: '',
      time_ago: 'Just now'
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editBrand(brand: Brand) {
    setFormData({
      brand_name: brand.brand_name,
      category: brand.category,
      caption: brand.caption,
      partnership: brand.partnership,
      link: brand.link,
      image_url: brand.image_url || '',
      time_ago: brand.time_ago || 'Just now'
    })
    setEditingItem(brand)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading brands...</p>
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
                Brand Partners
              </h1>
              <p className="text-sm text-gray-500">Manage affiliated brands and sponsors</p>
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
            <span>Add Brand</span>
          </button>
        </div>
      </header>

      {/* Love Note */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-lg font-medium">
            These amazing brands believe in me and my journey. Please show them some love and support—they're part of the Spice Diana family. 🇺🇬✨
          </p>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {brands.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {brands.map((brand) => (
              <div key={brand.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Brand Logo */}
                    <div className="relative w-24 h-24 bg-pink-100 rounded-xl overflow-hidden flex-shrink-0">
                      {brand.image_url ? (
                        <Image 
                          src={brand.image_url} 
                          alt={brand.brand_name} 
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Briefcase size={40} className="text-pink-400" />
                        </div>
                      )}
                    </div>

                    {/* Brand Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{brand.brand_name}</h3>
                            <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                              {brand.category}
                            </span>
                            <span className="text-xs text-gray-400">{brand.time_ago}</span>
                          </div>
                          <p className="text-pink-600 text-sm font-medium mb-2">{brand.partnership}</p>
                          <p className="text-gray-600 mb-4">{brand.caption}</p>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-3">
                            <a 
                              href={brand.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                            >
                              Visit Website <ExternalLink size={14} />
                            </a>
                            <button 
                              onClick={() => editBrand(brand)}
                              className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => deleteBrand(brand.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-pink-100">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No brand partners yet</h3>
            <p className="text-gray-500 mb-6">Add brands that Spice Diana works with</p>
            <button 
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Your First Brand
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
                  {editingItem ? 'Edit' : 'Add New'} Brand
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Logo</label>
                <div className="relative">
                  {formData.image_url ? (
                    <div className="relative w-full h-48 bg-pink-100 rounded-2xl overflow-hidden group">
                      <Image 
                        src={formData.image_url} 
                        alt="Brand" 
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain p-4"
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
                      <p className="text-gray-600 font-medium mb-1">Click to upload brand logo</p>
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

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.brand_name ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. Pepsi Uganda"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                />
                {formErrors.brand_name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.brand_name}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.category ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. Beverage, Telecom, Fashion"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                />
                {formErrors.category && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.category}
                  </p>
                )}
              </div>

              {/* Partnership */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Partnership Type</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.partnership ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. Global Ambassador since 2023"
                  value={formData.partnership}
                  onChange={(e) => setFormData({...formData, partnership: e.target.value})}
                />
                {formErrors.partnership && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.partnership}
                  </p>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption / Description</label>
                <textarea 
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.caption ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="Describe the partnership..."
                  value={formData.caption}
                  onChange={(e) => setFormData({...formData, caption: e.target.value})}
                  rows={3}
                />
                {formErrors.caption && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.caption}
                  </p>
                )}
              </div>

              {/* Website Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website Link</label>
                <input 
                  type="url"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.link ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="https://..."
                  value={formData.link}
                  onChange={(e) => setFormData({...formData, link: e.target.value})}
                />
                {formErrors.link && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.link}
                  </p>
                )}
              </div>

              {/* Time Ago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Label</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                  placeholder="e.g. 2h ago, Yesterday, Just now"
                  value={formData.time_ago}
                  onChange={(e) => setFormData({...formData, time_ago: e.target.value})}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-pink-100">
                <button 
                  onClick={saveBrand}
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
                      {editingItem ? 'Update Brand' : 'Add Brand'}
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