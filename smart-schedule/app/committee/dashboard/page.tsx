'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function CommitteeDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [schedules] = useState([
    { id: '1', name: 'Fall 2024 Draft', status: 'Draft', courses: 15, sections: 25, lastModified: '2 hours ago' },
    { id: '2', name: 'Spring 2024 Final', status: 'Final', courses: 12, sections: 20, lastModified: '1 week ago' }
  ])
  const [feedback] = useState([
    { id: 1, from: 'Student', message: 'CS301 time conflict with MATH201', status: 'Pending', time: '1 hour ago' },
    { id: 2, from: 'Faculty', message: 'Room capacity insufficient for CS101', status: 'Resolved', time: '2 days ago' }
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Committee Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Scheduling Committee</div>
            </div>
          </div>
        </div>
      </header>

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
              <Link href="/committee/schedules" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Draft Schedules
              </Link>
              <Link href="/committee/recommendations" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Recommendations
              </Link>
              <Link href="/committee/feedback" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Feedback
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Schedules</h3>
                    <p className="text-3xl font-bold text-blue-600">{schedules.length}</p>
                    <p className="text-sm text-gray-600">In progress</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Courses</h3>
                    <p className="text-3xl font-bold text-green-600">{schedules.reduce((sum, s) => sum + s.courses, 0)}</p>
                    <p className="text-sm text-gray-600">Across all schedules</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Sections</h3>
                    <p className="text-3xl font-bold text-purple-600">{schedules.reduce((sum, s) => sum + s.sections, 0)}</p>
                    <p className="text-sm text-gray-600">Scheduled</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Feedback</h3>
                    <p className="text-3xl font-bold text-yellow-600">{feedback.filter(f => f.status === 'Pending').length}</p>
                    <p className="text-sm text-gray-600">Items to review</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Schedules</h3>
                    <div className="space-y-3">
                      {schedules.map(schedule => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                            <p className="text-sm text-gray-600">{schedule.courses} courses • {schedule.sections} sections</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              schedule.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {schedule.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{schedule.lastModified}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
                    <div className="space-y-3">
                      {feedback.map(item => (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{item.from}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{item.message}</p>
                          <p className="text-xs text-gray-500">{item.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
