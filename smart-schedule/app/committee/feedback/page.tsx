'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppHeader } from '../../../components/AppHeader'
import api from '../../../lib/api'

interface FeedbackItem {
  id: string
  from: string
  name: string
  message: string
  status: string
  time: string
  priority: string
  rating?: number
  createdAt: string
  userId: string
}

export default function CommitteeFeedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('All')
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getFeedback()
      
      if (response.success && response.data) {
        // Map API response to UI format
        // response.data might be an array or an object with data property
        const feedbackData = Array.isArray(response.data) ? response.data : (response.data as any)?.data || []
        const mappedFeedback: FeedbackItem[] = feedbackData.map((item: any) => ({
          id: item.id,
          from: item.user?.role || 'Unknown',
          name: item.user?.name || 'Unknown',
          message: item.content,
          status: 'Pending', // Status is not in the model, defaulting to Pending
          time: formatTimeAgo(item.createdAt),
          priority: getPriorityFromRating(item.rating),
          rating: item.rating,
          createdAt: item.createdAt,
          userId: item.userId,
        }))
        setFeedback(mappedFeedback)
      } else {
        setError('Failed to load feedback')
      }
    } catch (err) {
      console.error('Error fetching feedback:', err)
      setError('Failed to load feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const getPriorityFromRating = (rating?: number): string => {
    if (!rating) return 'Medium'
    if (rating >= 4) return 'High'
    if (rating >= 2) return 'Medium'
    return 'Low'
  }

  const filteredFeedback = feedback.filter(item => 
    filter === 'All' || item.status.toLowerCase() === filter.toLowerCase()
  )

  const updateStatus = async (id: string, newStatus: string) => {
    // Update local state immediately for better UX
    setFeedback(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ))
    
    if (selectedFeedback?.id === id) {
      setSelectedFeedback(prev => prev ? { ...prev, status: newStatus } : null)
    }

    // Note: Status update would require updating the feedback model to include a status field
    // For now, we're only updating the UI state
    // TODO: Add status field to Feedback model or use a different approach
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'In Review': return 'bg-blue-100 text-blue-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Feedback Management" 
        backFallbackUrl="/committee/dashboard"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feedback List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Feedback Items</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {loading ? 'Loading...' : `${filteredFeedback.length} items • ${feedback.filter(f => f.status === 'Pending').length} pending`}
                </p>
              </div>
              
              {error && (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {error}
                    <button 
                      onClick={fetchFeedback}
                      className="ml-4 text-red-600 underline hover:text-red-800"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {loading && !error && (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-sm text-gray-600">Loading feedback...</p>
                </div>
              )}

              {!loading && !error && filteredFeedback.length === 0 && (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filter === 'All' ? 'No feedback has been submitted yet.' : `No ${filter.toLowerCase()} feedback found.`}
                  </p>
                </div>
              )}
              
              {!loading && !error && (
              <div className="divide-y divide-gray-200">
                {filteredFeedback.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFeedback(item)}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedFeedback?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          <span className="text-sm text-gray-500">({item.from})</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{item.message}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-gray-500">{item.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>

          {/* Feedback Details */}
          <div className="lg:col-span-1">
            {selectedFeedback ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">From</label>
                    <p className="text-sm text-gray-900">{selectedFeedback.name} ({selectedFeedback.from})</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Message</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedFeedback.message}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedFeedback.priority)}`}>
                      {selectedFeedback.priority}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <select
                        value={selectedFeedback.status}
                        onChange={(e) => updateStatus(selectedFeedback.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Review">In Review</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted</label>
                    <p className="text-sm text-gray-900">{selectedFeedback.time}</p>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Add Response
                  </button>
                  <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    Mark as Resolved
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback selected</h3>
                <p className="mt-1 text-sm text-gray-500">Choose a feedback item to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
