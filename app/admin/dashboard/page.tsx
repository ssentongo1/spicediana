import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { 
  Music, 
  ShoppingBag, 
  Calendar, 
  Users, 
  Megaphone, 
  Briefcase, 
  Newspaper, 
  Info,
  Star,
  Crown,
  Image as ImageIcon,
  Globe,
  Music2,
  Youtube,
  DollarSign,
  Heart,
  ArrowRight,
  Clock
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  
  if (!session) {
    redirect('/admin')
  }

  // Fetch real stats from Supabase
  const [musicCount, productsCount, eventsCount, officialCount, brandsCount, blogCount, featuredCount, feedCount, socialCount, streamingCount, youtubeCount, adsCount, ngoCount] = await Promise.all([
    supabase.from('music').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('featured_posts').select('*', { count: 'exact', head: true }),
    supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
    supabase.from('social_links').select('*', { count: 'exact', head: true }),
    supabase.from('streaming_platforms').select('*', { count: 'exact', head: true }),
    supabase.from('youtube_videos').select('*', { count: 'exact', head: true }),
    supabase.from('ads').select('*', { count: 'exact', head: true }),
    supabase.from('ngo_posts').select('*', { count: 'exact', head: true }),
  ])

  // Fetch pending posts count for Team Spice
  const { count: pendingPostsCount } = await supabase
    .from('community_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const stats = {
    music: musicCount.count || 0,
    shop: productsCount.count || 0,
    events: eventsCount.count || 0,
    team: pendingPostsCount || 0,
    official: officialCount.count || 0,
    brands: brandsCount.count || 0,
    blog: blogCount.count || 0,
    featured: featuredCount.count || 0,
    feed: feedCount.count || 0,
    social: socialCount.count || 0,
    streaming: streamingCount.count || 0,
    youtube: youtubeCount.count || 0,
    ads: adsCount.count || 0,
    ngo: ngoCount.count || 0
  }

  // Get recent activity
  const { data: recentMusic } = await supabase
    .from('music')
    .select('title, created_at')
    .order('created_at', { ascending: false })
    .limit(2)

  const { data: recentProducts } = await supabase
    .from('products')
    .select('name, created_at')
    .order('created_at', { ascending: false })
    .limit(2)

  const { data: recentFeed } = await supabase
    .from('feed_posts')
    .select('caption, created_at')
    .order('created_at', { ascending: false })
    .limit(2)

  const { data: recentNgo } = await supabase
    .from('ngo_posts')
    .select('title, created_at')
    .order('created_at', { ascending: false })
    .limit(2)

  // Get pending posts separately to avoid type issues
  const { data: pendingPosts } = await supabase
    .from('community_posts')
    .select('content, created_at, user_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(2)

  // Get usernames for pending posts
  let pendingActivities: { action: string; item: string; time: string }[] = []
  
  if (pendingPosts && pendingPosts.length > 0) {
    for (const post of pendingPosts) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', post.user_id)
        .single()
      
      pendingActivities.push({
        action: 'Pending post from',
        item: `@${profile?.username || 'fan'}`,
        time: new Date(post.created_at).toLocaleDateString()
      })
    }
  }

  const recentActivity = [
    ...(recentMusic?.map(item => ({ 
      action: 'New music added', 
      item: item.title || 'Untitled', 
      time: new Date(item.created_at).toLocaleDateString() 
    })) || []),
    ...(recentProducts?.map(item => ({ 
      action: 'New product', 
      item: item.name || 'Unnamed', 
      time: new Date(item.created_at).toLocaleDateString() 
    })) || []),
    ...(recentFeed?.map(item => ({ 
      action: 'New feed post', 
      item: item.caption?.substring(0, 30) || 'New post', 
      time: new Date(item.created_at).toLocaleDateString() 
    })) || []),
    ...(recentNgo?.map(item => ({ 
      action: 'New foundation post', 
      item: item.title, 
      time: new Date(item.created_at).toLocaleDateString() 
    })) || []),
    ...pendingActivities
  ].slice(0, 5)

  const sections = [
    { name: 'Music', href: '/admin/music', icon: Music, count: stats.music, bg: 'bg-pink-100' },
    { name: 'Shop', href: '/admin/shop', icon: ShoppingBag, count: stats.shop, bg: 'bg-purple-100' },
    { name: 'Events', href: '/admin/events', icon: Calendar, count: stats.events, bg: 'bg-blue-100' },
    { name: 'Team Spice', href: '/admin/team', icon: Users, count: stats.team, bg: 'bg-emerald-100' },
    { name: 'Official', href: '/admin/official', icon: Megaphone, count: stats.official, bg: 'bg-amber-100' },
    { name: 'Brands', href: '/admin/brands', icon: Briefcase, count: stats.brands, bg: 'bg-violet-100' },
    { name: 'Blog', href: '/admin/blog', icon: Newspaper, count: stats.blog, bg: 'bg-cyan-100' },
    { name: 'Featured', href: '/admin/featured', icon: Star, count: stats.featured, bg: 'bg-yellow-100' },
    { name: 'Feed', href: '/admin/feed', icon: ImageIcon, count: stats.feed, bg: 'bg-pink-100' },
    { name: 'Social Links', href: '/admin/social', icon: Globe, count: stats.social, bg: 'bg-blue-100' },
    { name: 'Streaming', href: '/admin/streaming', icon: Music2, count: stats.streaming, bg: 'bg-green-100' },
    { name: 'YouTube', href: '/admin/youtube', icon: Youtube, count: stats.youtube, bg: 'bg-red-100' },
    { name: 'Ads', href: '/admin/ads', icon: DollarSign, count: stats.ads, bg: 'bg-purple-100' },
    { name: 'NGO', href: '/admin/ngo', icon: Heart, count: stats.ngo, bg: 'bg-green-100' },
    { name: 'Spice Account', href: '/admin/spice', icon: Crown, count: null, bg: 'bg-yellow-100' },
    { name: 'About', href: '/admin/about', icon: Info, count: null, bg: 'bg-gray-100' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 p-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500">Welcome back, Manager</p>
          </div>
          <div className="flex items-center gap-2 bg-pink-50 px-3 py-1.5 rounded-full">
            <Heart size={16} className="text-pink-600" />
            <span className="text-sm text-pink-600 font-medium">Spice Diana</span>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sections.map((section) => (
            <Link 
              key={section.name}
              href={section.href}
              className="bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${section.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition`}>
                  <section.icon size={20} className="text-pink-600" />
                </div>
                {section.count !== null && (
                  <span className="text-lg font-bold text-pink-600">{section.count}</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-700">{section.name}</p>
              {section.name === 'Team Spice' && stats.team > 0 && (
                <p className="text-xs text-yellow-600 mt-1">⚠️ {stats.team} pending</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Welcome Card */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-xl p-6 text-white shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Heart size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">Ready to create something amazing?</h2>
              <p className="text-pink-100 text-sm">Manage all your content from one place</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            <Clock size={18} className="text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-pink-50/50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                    <p className="text-sm font-medium text-gray-800">{activity.item}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">QUICK ACTIONS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link 
            href="/admin/music?action=new" 
            className="bg-white p-4 rounded-xl border border-pink-100 hover:border-pink-300 transition flex items-center justify-between group"
          >
            <span className="text-sm text-gray-700">➕ Add Music</span>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
          </Link>
          <Link 
            href="/admin/shop?action=new" 
            className="bg-white p-4 rounded-xl border border-pink-100 hover:border-pink-300 transition flex items-center justify-between group"
          >
            <span className="text-sm text-gray-700">🛍️ Add Product</span>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
          </Link>
          <Link 
            href="/admin/feed?action=new" 
            className="bg-white p-4 rounded-xl border border-pink-100 hover:border-pink-300 transition flex items-center justify-between group"
          >
            <span className="text-sm text-gray-700">📸 New Feed Post</span>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
          </Link>
          <Link 
            href="/admin/ngo?action=new" 
            className="bg-white p-4 rounded-xl border border-pink-100 hover:border-pink-300 transition flex items-center justify-between group"
          >
            <span className="text-sm text-gray-700">🤝 New NGO Post</span>
            <ArrowRight size={16} className="text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </div>
    </div>
  )
}