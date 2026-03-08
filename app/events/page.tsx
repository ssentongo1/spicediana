'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Calendar,
  MapPin,
  DollarSign,
  Ticket,
  X,
  Clock,
  Heart
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

// Types
interface Event {
  id: number
  title: string
  date: string
  venue: string
  city: string
  price_usd: number | null
  price_ugx: number | null
  description: string | null
  image_url: string | null
  status: 'upcoming' | 'past'
  ticket_link: string | null
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error: any) {
      console.error('Error fetching events:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true
    return event.status === filter
  })

  function openEventModal(event: Event) {
    setSelectedEvent(event)
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
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
              Events & Tour Dates
            </h1>
            <p className="text-sm text-gray-500">Catch Spice Diana live in your city</p>
          </div>
        </div>
      </header>

      {/* Hero Banner - Mobile Optimized */}
      {events.filter(e => e.status === 'upcoming').length > 0 && (
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-pink-600 to-pink-400 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white rounded-full"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
            <div className="text-white">
              <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Next Show</h2>
              <p className="text-pink-100 text-xs md:text-lg">
                {events.filter(e => e.status === 'upcoming')[0]?.title} • {events.filter(e => e.status === 'upcoming')[0]?.date}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-center">
          <div className="bg-white rounded-xl p-1 shadow-sm border border-pink-100 inline-flex">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                filter === 'upcoming' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              Upcoming ({events.filter(e => e.status === 'upcoming').length})
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                filter === 'past' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              Past ({events.filter(e => e.status === 'past').length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                filter === 'all' 
                  ? 'bg-pink-600 text-white shadow-md' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-4">
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => openEventModal(event)}
                className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-pink-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                {/* Event Image */}
                <div className="relative h-40 md:h-48 bg-gradient-to-br from-pink-100 to-pink-50">
                  {event.image_url ? (
                    <Image 
                      src={event.image_url} 
                      alt={event.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar size={32} className="md:w-12 md:h-12 text-pink-300" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium ${
                      event.status === 'upcoming' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {event.status === 'upcoming' ? 'Upcoming' : 'Past'}
                    </span>
                  </div>
                </div>

                {/* Event Info */}
                <div className="p-4 md:p-5">
                  <h3 className="font-semibold text-gray-800 text-base md:text-xl mb-2 md:mb-3 line-clamp-2">{event.title}</h3>
                  
                  <div className="space-y-1 md:space-y-2 mb-3 md:mb-4">
                    <div className="flex items-center text-gray-600 text-xs md:text-sm">
                      <Calendar size={12} className="md:w-4 md:h-4 mr-2 text-pink-400" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-gray-600 text-xs md:text-sm">
                      <MapPin size={12} className="md:w-4 md:h-4 mr-2 text-pink-400" />
                      <span className="truncate">{event.venue}, {event.city}</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2 hidden md:block">{event.description}</p>
                  )}

                  {/* Price and Action */}
                  <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-pink-100">
                    <div>
                      {event.price_usd ? (
                        <div>
                          <span className="text-sm md:text-xl font-bold text-pink-600">${event.price_usd}</span>
                          {event.price_ugx && (
                            <p className="text-xs text-gray-400 hidden md:block">UGX {event.price_ugx.toLocaleString()}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs md:text-sm text-gray-500">Free Entry</span>
                      )}
                    </div>
                    
                    {event.status === 'upcoming' ? (
                      event.ticket_link ? (
                        <span className="text-xs md:text-sm text-pink-600 font-medium">View Details →</span>
                      ) : (
                        <span className="text-xs text-gray-400">Tickets Soon</span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">Event Ended</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-pink-100">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={24} className="md:w-8 md:h-8 text-pink-400" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No events found</h3>
            <p className="text-sm md:text-base text-gray-500">
              {filter === 'upcoming' 
                ? 'No upcoming events at the moment. Check back soon!' 
                : filter === 'past'
                ? 'No past events to show'
                : 'No events available'}
            </p>
          </div>
        )}
      </div>

      {/* Event Details Modal - Mobile Optimized */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl md:rounded-3xl shadow-2xl max-h-[98vh] md:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-pink-100 p-3 md:p-6 rounded-t-xl md:rounded-t-3xl">
              <div className="flex items-start gap-2 md:gap-4">
                <div className="relative w-12 h-12 md:w-16 md:h-16 bg-pink-100 rounded-lg md:rounded-xl overflow-hidden flex-shrink-0">
                  {selectedEvent.image_url ? (
                    <Image 
                      src={selectedEvent.image_url} 
                      alt={selectedEvent.title} 
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar size={20} className="md:w-6 md:h-6 text-pink-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h2 className="text-base md:text-2xl font-bold text-gray-800 line-clamp-2">{selectedEvent.title}</h2>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    {selectedEvent.status === 'upcoming' ? 'Upcoming Event' : 'Past Event'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="absolute top-3 right-3 md:static w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-pink-50 flex items-center justify-center transition flex-shrink-0"
                >
                  <X size={16} className="md:w-5 md:h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-3 md:p-6">
              <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8">
                {/* Left Column - Image */}
                <div>
                  <div className="relative aspect-square bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg md:rounded-2xl overflow-hidden">
                    {selectedEvent.image_url ? (
                      <Image
                        src={selectedEvent.image_url}
                        alt={selectedEvent.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar size={48} className="md:w-20 md:h-20 text-pink-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Details */}
                <div>
                  {/* Date & Venue */}
                  <div className="bg-pink-50 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6">
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar size={12} className="md:w-4 md:h-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="text-sm md:text-base font-medium text-gray-800">{selectedEvent.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin size={12} className="md:w-4 md:h-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Venue</p>
                          <p className="text-sm md:text-base font-medium text-gray-800">{selectedEvent.venue}</p>
                          <p className="text-xs text-gray-500">{selectedEvent.city}</p>
                        </div>
                      </div>
                      {selectedEvent.ticket_link && (
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Ticket size={12} className="md:w-4 md:h-4 text-pink-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Tickets</p>
                            <a 
                              href={selectedEvent.ticket_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-600 text-sm md:text-base font-medium hover:underline"
                            >
                              Buy Tickets →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="mb-4 md:mb-6">
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-2">About the Event</h3>
                      <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                    </div>
                  )}

                  {/* Price */}
                  <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-lg md:rounded-xl p-4 md:p-6 text-white mb-4 md:mb-6">
                    <p className="text-pink-100 text-xs md:text-sm mb-1">Ticket Price</p>
                    <div className="flex items-end gap-2 md:gap-3">
                      {selectedEvent.price_usd ? (
                        <>
                          <span className="text-2xl md:text-4xl font-bold">${selectedEvent.price_usd}</span>
                          {selectedEvent.price_ugx && (
                            <span className="text-pink-200 text-xs md:text-sm mb-1">UGX {selectedEvent.price_ugx.toLocaleString()}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-xl md:text-3xl font-bold">Free Entry</span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {selectedEvent.status === 'upcoming' && selectedEvent.ticket_link && (
                    <a 
                      href={selectedEvent.ticket_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white py-3 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <Ticket size={16} className="md:w-5 md:h-5" />
                      Get Your Tickets Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}