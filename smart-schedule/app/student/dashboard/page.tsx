'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'
import { AppHeader } from '../../../components/AppHeader'

export default function StudentDashboard() {
  const { getCurrentUser, logout } = useAuth()
  const user = getCurrentUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [notifications] = useState([
    { id: 1, message: 'New schedule draft available', time: '2 hours ago', unread: true },
    { id: 2, message: 'Elective preferences updated', time: '1 day ago', unread: false }
  ])

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Student Dashboard" 
        showBack={false}
      />
      
      {/* Student Info Bar */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium">University ID:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                {user?.universityId || 'STU000001'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">College:</span>
              <span>College of Computer Science</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Major:</span>
              <span>Computer Science</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 bg-white rounded-lg shadow-sm p-6 h-fit">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Overview
              </button>
              <Link href="/student/preferences" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Preferences
              </Link>
              <Link href="/student/schedule" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                My Schedule
              </Link>
              <Link href="/student/notifications" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Notifications
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Enrolled Courses</h3>
                    <p className="text-3xl font-bold text-blue-600">5</p>
                    <p className="text-sm text-gray-600">This semester</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Electives</h3>
                    <p className="text-3xl font-bold text-green-600">2</p>
                    <p className="text-sm text-gray-600">Selected</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Status</h3>
                    <p className="text-3xl font-bold text-yellow-600">Draft</p>
                    <p className="text-sm text-gray-600">Under review</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {notifications.map(notification => (
                      <div key={notification.id} className={`p-3 rounded-lg ${notification.unread ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
