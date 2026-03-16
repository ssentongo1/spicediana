'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Heart, 
  Camera,
  Film,
  MapPin,
  Calendar,
  ChevronRight,
  Play,
  X,
  DollarSign,
  Users,
  Target,
  Award,
  CreditCard,
  Smartphone
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/LoadingSpinner'

interface NGOPost {
  id: number
  title: string
  content: string
  media_url: string | null
  media_type: 'image' | 'video'
  campaign_name: string | null
  location: string | null
  date: string | null
  is_active: boolean
  display_order: number
}

export default function NGOPage() {
  const [posts, setPosts] = useState<NGOPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<NGOPost | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<string>('')
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorMessage, setDonorMessage] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card')

  // Impact stats
  const impactStats = [
    { label: 'Girls Educated', value: '500+', icon: Users },
    { label: 'Schools Supported', value: '12', icon: Target },
    { label: 'Communities Reached', value: '25', icon: Award },
  ]

  const presetAmounts = ['$10', '$25', '$50', '$100', '$250']

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('ngo_posts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching NGO posts:', error)
    } finally {
      setLoading(false)
    }
  }

  function openPostModal(post: NGOPost) {
    setSelectedPost(post)
    setShowModal(true)
  }

  function handlePresetAmount(amount: string) {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  function handleCustomAmount(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomAmount(e.target.value)
    setSelectedAmount('')
  }

  function getFinalAmount(): string {
    if (customAmount) return `$${customAmount}`
    if (selectedAmount) return selectedAmount
    return ''
  }

  // PREMIUM LOADING SPINNER
  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
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
                Spice Diana's Kwaya Foundation
              </h1>
              <p className="text-sm text-gray-500">Empowering communities, changing lives</p>
            </div>
          </div>

          {/* Donate Button */}
          <button
            onClick={() => setShowDonateModal(true)}
            className="bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition shadow-md flex items-center gap-2"
          >
            <Heart size={16} />
            Donate
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Making a Difference</h2>
          <p className="text-pink-100 text-base max-w-2xl">
            Through education, empowerment, and community support, we're creating opportunities for Uganda's next generation.
          </p>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {impactStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-5 border border-pink-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                    <Icon size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Impact Stories</h3>
          <p className="text-xs text-gray-400">{posts.length} stories</p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => openPostModal(post)}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-lg border border-pink-100 overflow-hidden hover:shadow-md transition">
                  {/* Media */}
                  <div className="relative h-48 bg-gray-100">
                    {post.media_url && post.media_type === 'image' ? (
                      <Image
                        src={post.media_url}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : post.media_type === 'video' ? (
                      <div className="relative w-full h-full">
                        <video
                          src={post.media_url || ''}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                            <Play size={16} className="text-pink-600 ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart size={32} className="text-gray-300" />
                      </div>
                    )}

                    {/* Campaign Badge */}
                    {post.campaign_name && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-pink-600 shadow-sm">
                        {post.campaign_name}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 text-base mb-2 line-clamp-2">{post.title}</h4>
                    
                    {/* Location & Date */}
                    <div className="flex items-center gap-3 mb-2 text-xs text-gray-400">
                      {post.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{post.location}</span>
                        </div>
                      )}
                      {post.date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{post.date}</span>
                        </div>
                      )}
                    </div>

                    {/* Description Preview */}
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{post.content}</p>

                    {/* Read More */}
                    <div className="text-pink-600 text-xs font-medium flex items-center gap-1">
                      Read more <ChevronRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center border border-pink-100">
            <Heart size={40} className="mx-auto text-pink-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">Coming Soon</h3>
            <p className="text-xs text-gray-500">Impact stories will be shared here</p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="bg-pink-50 rounded-lg p-6 border border-pink-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <Heart size={18} className="text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">Join Us in Making a Difference</h3>
                <p className="text-xs text-gray-500">Your support helps us reach more communities</p>
              </div>
            </div>
            <button
              onClick={() => setShowDonateModal(true)}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
            >
              Donate Now
            </button>
          </div>
        </div>
      </div>

      {/* Story Modal */}
      {showModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{selectedPost.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-pink-50 flex items-center justify-center"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Media */}
              {selectedPost.media_url && (
                <div className="relative h-64 mb-4 bg-black rounded-lg overflow-hidden">
                  {selectedPost.media_type === 'image' ? (
                    <Image
                      src={selectedPost.media_url}
                      alt={selectedPost.title}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <video
                      src={selectedPost.media_url}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              )}

              {/* Campaign Details */}
              <div className="bg-pink-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  {selectedPost.campaign_name && (
                    <div>
                      <p className="text-xs text-gray-400">Campaign</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPost.campaign_name}</p>
                    </div>
                  )}
                  {selectedPost.location && (
                    <div>
                      <p className="text-xs text-gray-400">Location</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPost.location}</p>
                    </div>
                  )}
                  {selectedPost.date && (
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-800">{selectedPost.date}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Story */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 leading-relaxed">{selectedPost.content}</p>
              </div>

              {/* Donate Button */}
              <button
                onClick={() => {
                  setShowModal(false)
                  setShowDonateModal(true)
                }}
                className="w-full bg-pink-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
              >
                Support This Cause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="bg-gradient-to-r from-pink-600 to-pink-500 p-5 rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Make a Donation</h3>
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-pink-100 text-xs mt-1">100% goes directly to the cause</p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Select Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handlePresetAmount(amount)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                        selectedAmount === amount
                          ? 'bg-pink-600 text-white shadow-md'
                          : 'bg-pink-50 text-gray-700 hover:bg-pink-100 border border-pink-100'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Custom Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={handleCustomAmount}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-2.5 border border-pink-100 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                  />
                </div>
              </div>

              {/* Selected Amount Display */}
              {getFinalAmount() && (
                <div className="bg-pink-50 p-3 rounded-lg text-center">
                  <span className="text-xs text-gray-500">You're donating</span>
                  <span className="block text-xl font-bold text-pink-600">{getFinalAmount()}</span>
                </div>
              )}

              {/* Donor Information */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Full Name *"
                  className="w-full p-3 border border-pink-100 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                />
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="Email Address *"
                  className="w-full p-3 border border-pink-100 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                />
                <textarea
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  placeholder="Leave a message (optional)"
                  rows={2}
                  className="w-full p-3 border border-pink-100 rounded-lg text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:border-pink-300"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                      paymentMethod === 'card'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <CreditCard size={16} />
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile')}
                    className={`py-3 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                      paymentMethod === 'mobile'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Smartphone size={16} />
                    Mobile Money
                  </button>
                </div>
              </div>

              {/* Donate Button */}
              <button
                className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3.5 rounded-lg font-medium hover:shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                disabled={!donorName || !donorEmail || (!selectedAmount && !customAmount)}
              >
                Complete Donation
              </button>

              {/* Security Note */}
              <p className="text-xs text-center text-gray-400 pb-2">
                🔒 Secure donation processing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}