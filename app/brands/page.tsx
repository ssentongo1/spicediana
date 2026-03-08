'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Briefcase,
  ExternalLink,
  Heart,
  Clock,
  X
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

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [showModal, setShowModal] = useState(false)

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

  // Group brands by category
  const categories = brands.reduce((acc, brand) => {
    if (!acc[brand.category]) {
      acc[brand.category] = []
    }
    acc[brand.category].push(brand)
    return acc
  }, {} as Record<string, Brand[]>)

  function openBrandModal(brand: Brand) {
    setSelectedBrand(brand)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading brand partners...</p>
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
              Affiliated Brands
            </h1>
            <p className="text-sm text-gray-500">Partners who believe in the journey</p>
          </div>
        </div>
      </header>

      {/* Hero Message - Clean & Premium */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-xl p-4 md:p-6 text-white shadow-md">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <Heart size={16} className="md:w-5 md:h-5 text-pink-200" />
            <h2 className="text-base md:text-lg font-semibold">Proud Partners</h2>
          </div>
          <p className="text-pink-100 text-xs md:text-sm leading-relaxed">
            These amazing brands are part of the Spice Diana family. Show them some love. 🇺🇬
          </p>
        </div>
      </div>

      {/* Brands by Category */}
      <div className="max-w-7xl mx-auto px-4">
        {brands.length > 0 ? (
          <div className="space-y-8 md:space-y-12">
            {Object.entries(categories).map(([category, categoryBrands]) => (
              <div key={category}>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
                  <Briefcase size={16} className="md:w-5 md:h-5 text-pink-600" />
                  {category}
                  <span className="text-xs md:text-sm font-normal text-gray-400 ml-2">
                    ({categoryBrands.length} partners)
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {categoryBrands.map((brand) => (
                    <div 
                      key={brand.id} 
                      onClick={() => openBrandModal(brand)}
                      className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <div className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                          {/* Brand Logo */}
                          <div className="relative w-20 h-20 md:w-32 md:h-32 bg-pink-50 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border-2 border-pink-100">
                            {brand.image_url ? (
                              <Image 
                                src={brand.image_url} 
                                alt={brand.brand_name} 
                                fill
                                sizes="(max-width: 768px) 80px, 128px"
                                className="object-contain p-2 md:p-4"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Briefcase size={24} className="md:w-12 md:h-12 text-pink-300" />
                              </div>
                            )}
                          </div>

                          {/* Brand Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg md:text-2xl font-bold text-gray-800">{brand.brand_name}</h3>
                              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                                {brand.category}
                              </span>
                              {brand.time_ago && (
                                <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                                  <Clock size={10} className="md:w-3 md:h-3" />
                                  {brand.time_ago}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-pink-600 text-xs md:text-sm font-medium mb-1 md:mb-2">{brand.partnership}</p>
                            <p className="text-gray-600 text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-3">{brand.caption}</p>
                            
                            {/* View Details Indicator */}
                            <div className="mt-3 text-pink-600 text-xs md:text-sm font-medium">
                              View Details →
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-pink-100">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="md:w-8 md:h-8 text-pink-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No brand partners yet</h3>
            <p className="text-sm md:text-base text-gray-500">Check back soon for exciting partnerships</p>
          </div>
        )}
      </div>

      {/* Brand Details Modal - Mobile Optimized */}
      {showModal && selectedBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl md:rounded-3xl shadow-2xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-3 md:p-6 rounded-t-xl md:rounded-t-3xl">
              <div className="flex items-start gap-2 md:gap-4">
                <div className="relative w-12 h-12 md:w-16 md:h-16 bg-pink-50 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 border-2 border-pink-100">
                  {selectedBrand.image_url ? (
                    <Image 
                      src={selectedBrand.image_url} 
                      alt={selectedBrand.brand_name} 
                      fill
                      sizes="64px"
                      className="object-contain p-1 md:p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase size={20} className="md:w-8 md:h-8 text-pink-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h2 className="text-base md:text-2xl font-bold text-gray-800 line-clamp-2">{selectedBrand.brand_name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full text-xs font-medium">
                      {selectedBrand.category}
                    </span>
                    {selectedBrand.time_ago && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {selectedBrand.time_ago}
                      </span>
                    )}
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

            <div className="p-4 md:p-6">
              {/* Partnership Details */}
              <div className="bg-pink-50 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6">
                <p className="text-pink-600 text-sm md:text-base font-medium mb-1">{selectedBrand.partnership}</p>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{selectedBrand.caption}</p>
              </div>

              {/* Visit Button */}
              <a 
                href={selectedBrand.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                Visit {selectedBrand.brand_name}
                <ExternalLink size={16} className="md:w-5 md:h-5" />
              </a>

              {/* Footer Note */}
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-pink-100">
                <p className="text-xs md:text-sm text-gray-500 text-center">
                  Proud partner of Spice Diana
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note - Updated with link to About page booking section */}
      {brands.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
          <div className="bg-pink-50 rounded-xl p-4 md:p-6 text-center">
            <p className="text-xs md:text-sm text-gray-600">
              Interested in partnering with Spice Diana? {' '}
              <Link href="/about#booking" className="text-pink-600 font-medium hover:underline">
                Contact management
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}