'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  ShoppingBag, 
  Heart, 
  ShoppingCart,
  X,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Product {
  id: number
  name: string
  price_usd: number
  price_ugx: number | null
  category: string
  sizes: string[]
  caption: string
  image_url: string | null
  in_stock: boolean
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showQuickView, setShowQuickView] = useState(false)

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))]

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exclusive merchandise...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 transition text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
                Official Merch
              </h1>
              <p className="text-sm text-gray-500">Wear the brand. Support the music.</p>
            </div>
          </div>
          
          {/* Cart Icon */}
          <button className="relative p-2 hover:bg-pink-50 rounded-full transition">
            <ShoppingCart size={20} className="md:w-6 md:h-6 text-gray-700" />
            <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </header>

      {/* Hero Banner - Mobile Optimized */}
      <div className="relative h-32 md:h-48 bg-gradient-to-r from-pink-600 to-pink-400 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white rounded-full"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">New Collection</h2>
            <p className="text-pink-100 text-xs md:text-sm">Limited edition. Get yours before they're gone.</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-[73px] z-20 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center overflow-x-auto pb-2 scrollbar-hide gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-pink-50 text-gray-600 hover:bg-pink-100'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product)
                  setShowQuickView(true)
                }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg md:rounded-2xl overflow-hidden mb-2 md:mb-3 shadow-sm hover:shadow-xl transition-all duration-500">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={24} className="md:w-10 md:h-10 text-pink-300" />
                    </div>
                  )}
                  
                  {/* Quick Actions - Mobile Friendly */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 md:gap-3">
                    <button className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition">
                      <ShoppingCart size={14} className="md:w-5 md:h-5" />
                    </button>
                    <button className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition">
                      <Heart size={14} className="md:w-5 md:h-5" />
                    </button>
                  </div>

                  {/* Wishlist Button */}
                  <button className="absolute top-2 right-2 md:top-3 md:right-3 w-6 h-6 md:w-8 md:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Heart size={12} className="md:w-4 md:h-4 text-gray-600" />
                  </button>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 text-xs md:text-base mb-0.5 md:mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-1 md:mb-2 line-clamp-1 hidden md:block">{product.caption}</p>
                  <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-sm md:text-lg font-bold text-pink-600">${product.price_usd}</span>
                    {product.price_ugx && (
                      <span className="text-xs text-gray-400 hidden md:inline">UGX {product.price_ugx.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-pink-100">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={24} className="md:w-8 md:h-8 text-pink-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No products yet</h3>
            <p className="text-sm md:text-base text-gray-500">Check back soon for new merchandise</p>
          </div>
        )}
      </div>

      {/* Quick View Modal - Mobile Optimized */}
      {showQuickView && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl md:rounded-3xl shadow-2xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-3 md:p-6">
              {/* Close Button */}
              <div className="flex justify-end mb-2 md:mb-4">
                <button
                  onClick={() => setShowQuickView(false)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-pink-50 flex items-center justify-center"
                >
                  <X size={16} className="md:w-5 md:h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8">
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg md:rounded-2xl overflow-hidden">
                  {selectedProduct.image_url ? (
                    <Image
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={40} className="md:w-20 md:h-20 text-pink-300" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div>
                  <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">{selectedProduct.name}</h2>
                  <p className="text-sm md:text-base text-gray-500 mb-3 md:mb-4">{selectedProduct.caption}</p>
                  
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <span className="text-2xl md:text-3xl font-bold text-pink-600">${selectedProduct.price_usd}</span>
                    {selectedProduct.price_ugx && (
                      <span className="text-sm md:text-base text-gray-400">UGX {selectedProduct.price_ugx.toLocaleString()}</span>
                    )}
                  </div>

                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="mb-4 md:mb-6">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Select Size</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.sizes.map((size) => (
                          <button
                            key={size}
                            className="w-10 h-10 md:w-12 md:h-12 border-2 border-pink-100 rounded-lg hover:border-pink-600 hover:text-pink-600 transition text-sm md:text-base"
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                    <button className="flex-1 bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                      <ShoppingCart size={16} className="md:w-5 md:h-5" />
                      Add to Cart
                    </button>
                    <button className="w-full md:w-14 h-12 md:h-14 border-2 border-pink-200 rounded-lg md:rounded-xl hover:bg-pink-50 transition flex items-center justify-center">
                      <Heart size={16} className="md:w-5 md:h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-pink-100">
                    <h4 className="font-semibold text-gray-700 text-sm md:text-base mb-2">Product Details</h4>
                    <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-600">
                      <li>• 100% Official Merchandise</li>
                      <li>• High Quality Materials</li>
                      <li>• Ships within 3-5 business days</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}