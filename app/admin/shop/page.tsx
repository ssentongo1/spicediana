'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  ShoppingBag,
  DollarSign,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  Package
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Product {
  id: number
  name: string
  price: number
  price_usd: number
  price_ugx: number | null
  category: string
  sizes: string[]
  caption: string
  image_url: string | null
  in_stock: boolean
  created_at: string
}

interface FormData {
  name: string
  price_usd: string
  price_ugx: string
  category: string
  sizes: string
  caption: string
  image_url: string
  in_stock: boolean
}

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price_usd: '',
    price_ugx: '',
    category: 'clothing',
    sizes: '',
    caption: '',
    image_url: '',
    in_stock: true
  })

  const categories = ['clothing', 'accessories', 'headwear', 'posters', 'other']

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Error fetching products:', error.message)
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
      const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${fileName}`

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
    
    if (!formData.name.trim()) errors.name = 'Product name is required'
    if (!formData.price_usd) errors.price_usd = 'Price is required'
    if (parseFloat(formData.price_usd) <= 0) errors.price_usd = 'Price must be greater than 0'
    if (!formData.caption.trim()) errors.caption = 'Caption is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function saveProduct() {
    if (!validateForm()) return

    try {
      // Convert sizes string to array
      const sizesArray = formData.sizes
        ? formData.sizes.split(',').map(s => s.trim()).filter(s => s)
        : []

      const priceValue = parseFloat(formData.price_usd)

      const productData = {
        name: formData.name,
        price: priceValue, // Fill the required price column
        price_usd: priceValue,
        price_ugx: formData.price_ugx ? parseInt(formData.price_ugx) : null,
        category: formData.category,
        sizes: sizesArray,
        caption: formData.caption,
        image_url: formData.image_url || null,
        in_stock: formData.in_stock
      }

      let error
      if (editingItem) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData])
        error = insertError
      }

      if (error) throw error

      setShowForm(false)
      resetForm()
      fetchProducts()
      alert(editingItem ? 'Product updated successfully!' : 'Product added successfully!')
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchProducts()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      price_usd: '',
      price_ugx: '',
      category: 'clothing',
      sizes: '',
      caption: '',
      image_url: '',
      in_stock: true
    })
    setEditingItem(null)
    setFormErrors({})
  }

  function editProduct(product: Product) {
    setFormData({
      name: product.name,
      price_usd: product.price_usd.toString(),
      price_ugx: product.price_ugx?.toString() || '',
      category: product.category,
      sizes: product.sizes.join(', '),
      caption: product.caption,
      image_url: product.image_url || '',
      in_stock: product.in_stock
    })
    setEditingItem(product)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
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
                Product Manager
              </h1>
              <p className="text-sm text-gray-500">Manage your merchandise inventory</p>
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
            <span>New Product</span>
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-3xl font-bold text-gray-800">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Package className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-3xl font-bold text-gray-800">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Tag className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-3xl font-bold text-gray-800">
                  {products.filter(p => p.in_stock).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Check className="text-pink-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4">
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-pink-100 to-pink-50">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={48} className="text-pink-300" />
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.in_stock 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {product.in_stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg">{product.name}</h3>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => editProduct(product)}
                        className="p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.caption}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="text-xl font-bold text-pink-600">${product.price_usd}</span>
                      {product.price_ugx && (
                        <p className="text-xs text-gray-400">UGX {product.price_ugx.toLocaleString()}</p>
                      )}
                    </div>
                    <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                  </div>

                  {product.sizes && product.sizes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-pink-100">
                      <p className="text-xs text-gray-500 mb-1">Sizes: {product.sizes.join(' · ')}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-pink-100">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} className="text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">Add your first product to start selling</p>
            <button 
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-pink-700 transition inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Your First Product
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
                  {editingItem ? 'Edit' : 'Add New'} Product
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="relative">
                  {formData.image_url ? (
                    <div className="relative w-full h-64 bg-pink-100 rounded-2xl overflow-hidden group">
                      <Image 
                        src={formData.image_url} 
                        alt="Product" 
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
                      <p className="text-gray-600 font-medium mb-1">Click to upload product image</p>
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

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.name ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. Limited Edition Hoodie"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption / Short Description</label>
                <input 
                  type="text"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white ${
                    formErrors.caption ? 'border-red-300 bg-red-50' : 'border-pink-100 focus:border-pink-300'
                  }`}
                  placeholder="e.g. 100% cotton, signed by Spice"
                  value={formData.caption}
                  onChange={(e) => setFormData({...formData, caption: e.target.value})}
                />
                {formErrors.caption && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.caption}
                  </p>
                )}
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
                      placeholder="29.99"
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

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select 
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sizes <span className="text-gray-400 text-xs">(comma separated, e.g. S, M, L, XL)</span>
                </label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200 transition text-gray-800 bg-white"
                  placeholder="S, M, L, XL"
                  value={formData.sizes}
                  onChange={(e) => setFormData({...formData, sizes: e.target.value})}
                />
              </div>

              {/* In Stock Toggle */}
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="in_stock"
                  className="w-5 h-5 text-pink-600 rounded border-pink-300 focus:ring-pink-200"
                  checked={formData.in_stock}
                  onChange={(e) => setFormData({...formData, in_stock: e.target.checked})}
                />
                <label htmlFor="in_stock" className="text-sm text-gray-700">
                  In Stock (available for purchase)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-pink-100">
                <button 
                  onClick={saveProduct}
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
                      {editingItem ? 'Update Product' : 'Add Product'}
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