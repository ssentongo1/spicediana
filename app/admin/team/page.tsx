'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Check, 
  X, 
  Trash2,
  Users,
  Clock,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Profile {
  id: number
  username: string
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
  is_admin: boolean
}

interface Post {
  id: number
  user_id: number
  content: string | null
  image_url: string | null
  likes_count: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles: Profile
}

export default function AdminTeamPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending')
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            is_verified,
            is_admin
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updatePostStatus(postId: number, status: 'approved' | 'rejected') {
    setProcessing(postId)
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ status })
        .eq('id', postId)

      if (error) throw error
      fetchPosts()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  async function deletePost(postId: number) {
    if (!confirm('Are you sure you want to delete this post?')) return

    setProcessing(postId)
    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      fetchPosts()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const pendingPosts = posts.filter(p => p.status === 'pending')
  const approvedPosts = posts.filter(p => p.status === 'approved')
  const rejectedPosts = posts.filter(p => p.status === 'rejected')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading community posts...</p>
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
                Team Spice Moderation
              </h1>
              <p className="text-sm text-gray-500">Manage community posts</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-yellow-600" />
              <span className="text-sm text-gray-600">{pendingPosts.length} pending</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">{approvedPosts.length} approved</span>
            </div>
            <div className="flex items-center gap-2">
              <X size={16} className="text-red-600" />
              <span className="text-sm text-gray-600">{rejectedPosts.length} rejected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'approved'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Approved ({approvedPosts.length})
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="max-w-7xl mx-auto px-4">
        {activeTab === 'pending' && pendingPosts.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-pink-100">
            <Check size={40} className="mx-auto text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">All caught up!</h3>
            <p className="text-sm text-gray-500">No pending posts to review</p>
          </div>
        )}

        {activeTab === 'approved' && approvedPosts.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-pink-100">
            <Users size={40} className="mx-auto text-pink-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No approved posts</h3>
            <p className="text-sm text-gray-500">Posts you approve will appear here</p>
          </div>
        )}

        <div className="space-y-4">
          {(activeTab === 'pending' ? pendingPosts : approvedPosts).map((post) => (
            <div key={post.id} className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center overflow-hidden">
                    {post.profiles?.avatar_url ? (
                      <Image 
                        src={post.profiles.avatar_url} 
                        alt={post.profiles.username} 
                        width={40} 
                        height={40} 
                        className="object-cover"
                      />
                    ) : (
                      <Users size={18} className="text-pink-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {post.profiles?.full_name || post.profiles?.username}
                      </span>
                      {post.profiles?.is_verified && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">✓</span>
                      )}
                      {post.profiles?.is_admin && (
                        <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      @{post.profiles?.username} · {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  post.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {post.status}
                </span>
              </div>

              {/* Post Content */}
              {post.content && (
                <p className="text-gray-800 text-sm mb-4">{post.content}</p>
              )}

              {/* Post Image */}
              {post.image_url && (
                <div className="relative h-48 md:h-64 bg-pink-100 rounded-lg mb-4 overflow-hidden">
                  <Image src={post.image_url} alt="Post" fill className="object-cover" />
                </div>
              )}

              {/* Post Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <span>❤️ {post.likes_count} likes</span>
              </div>

              {/* Admin Actions */}
              {activeTab === 'pending' ? (
                <div className="flex gap-3 pt-4 border-t border-pink-100">
                  <button
                    onClick={() => updatePostStatus(post.id, 'approved')}
                    disabled={processing === post.id}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    {processing === post.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => updatePostStatus(post.id, 'rejected')}
                    disabled={processing === post.id}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    {processing === post.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                    Reject
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    disabled={processing === post.id}
                    className="px-4 border-2 border-red-200 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-end pt-4 border-t border-pink-100">
                  <button
                    onClick={() => deletePost(post.id)}
                    disabled={processing === post.id}
                    className="px-4 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition flex items-center gap-2"
                  >
                    {processing === post.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}