'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AppHeader } from '../../../components/AppHeader'

export default function CommitteeFeedback() {
  const [feedback, setFeedback] = useState([
    { 
      id: 1, 
      from: 'Student', 
      name: 'John Doe', 
      message: 'CS301 time conflict with MATH201 - both scheduled at 10:00 AM', 
      status: 'Pending', 
      time: '1 hour ago',
      priority: 'High'
    },
    { 
      id: 2, 
      from: 'Faculty', 
      name: 'Dr. Smith', 
      message: 'Room capacity insufficient for CS101 - need larger room for 35 students', 
      status: 'Resolved', 
      time: '2 days ago',
      priority: 'Medium'
    },
    { 
      id: 3, 
      from: 'Student', 
      name: 'Jane Wilson', 
      message: 'Prefer morning classes for electives', 
      status: 'Pending', 
      time: '3 hours ago',
      priority: 'Low'
    },
    { 
      id: 4, 
      from: 'Faculty', 
      name: 'Dr. Johnson', 
      message: 'Teaching load too heavy - need to reduce sections', 
      status: 'In Review', 
      time: '1 day ago',
      priority: 'High'
    }
  ])

  const [filter, setFilter] = useState('All')
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)

  const filteredFeedback = feedback.filter(item => 
    filter === 'All' || item.status.toLowerCase() === filter.toLowerCase()
  )

  const updateStatus = (id: number, newStatus: string) => {
    setFeedback(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ))
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
                  {filteredFeedback.length} items • {feedback.filter(f => f.status === 'Pending').length} pending
                </p>
              </div>
              
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
