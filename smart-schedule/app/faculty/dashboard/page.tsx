'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'

interface Assignment {
  id: string
  course: {
    code: string
    name: string
  }
  section: string
  time: string
  room: string
  students: number
  assignments: Array<{
    id: string
    student: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function FacultyDashboard() {
  const { getCurrentUser, authState } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  // Get faculty ID from authenticated user (now maps to database ID)
  const facultyId = getCurrentUser()?.id

  useEffect(() => {
    console.log('🔄 Faculty Dashboard useEffect triggered')
    console.log('🔄 Auth state:', { isLoading: authState.isLoading, isAuthenticated: authState.isAuthenticated })
    console.log('🔄 Faculty ID:', facultyId)
    
    // Only load assignments if auth is not loading and we have a faculty ID
    if (!authState.isLoading && facultyId) {
      console.log('🔄 Loading dashboard assignments for faculty ID:', facultyId)
      loadAssignments()
    } else if (!authState.isLoading && !facultyId) {
      console.log('⚠️ No faculty ID available, setting loading to false')
      setLoading(false)
    }
  }, [facultyId, authState.isLoading])

  const loadAssignments = async () => {
    if (!facultyId) return
    
    try {
      setLoading(true)
      console.log('🔄 Loading faculty assignments for dashboard:', facultyId)
      const response = await fetch(`/api/faculty/assignments?facultyId=${facultyId}`)
      const result = await response.json()
      
      if (result.success) {
        setAssignments(result.data)
        console.log('✅ Loaded dashboard assignments:', result.data.length)
      } else {
        console.error('❌ Error loading assignments:', result.error)
      }
    } catch (error) {
      console.error('❌ Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="faculty">
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Dr. Smith</div>
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
              <Link href="/faculty/availability" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Availability
              </Link>
              <Link href="/faculty/assignments" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                My Assignments
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading assignments...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Sections</h3>
                        <p className="text-3xl font-bold text-blue-600">{assignments.length}</p>
                        <p className="text-sm text-gray-600">This semester</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Students</h3>
                        <p className="text-3xl font-bold text-green-600">{assignments.reduce((sum, a) => sum + a.students, 0)}</p>
                        <p className="text-sm text-gray-600">Across all sections</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Hours</h3>
                        <p className="text-3xl font-bold text-purple-600">{assignments.length * 4}</p>
                        <p className="text-sm text-gray-600">Teaching load</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Assignments</h3>
                      {assignments.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No assignments found. Contact the committee for course assignments.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {assignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{assignment.course.code} - {assignment.course.name}</h4>
                                <p className="text-sm text-gray-600">Section {assignment.section} • {assignment.time} • {assignment.room}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{assignment.students} students</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Confirmed
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
