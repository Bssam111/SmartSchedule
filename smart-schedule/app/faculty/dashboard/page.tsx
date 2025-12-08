'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'
import { AppHeader } from '../../../components/AppHeader'

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
  const [currentSemester, setCurrentSemester] = useState<{ name: string; academicYear: string; semesterNumber: number } | null>(null)
  // Get faculty ID from authenticated user (now maps to database ID)
  const facultyId = getCurrentUser()?.id

  useEffect(() => {
    // Only load assignments if auth is not loading, user is authenticated, and we have a faculty ID
    if (!authState.isLoading && authState.isAuthenticated && facultyId) {
      loadAssignments()
      loadCurrentSemester()
    } else if (!authState.isLoading && !authState.isAuthenticated) {
      setLoading(false)
    } else if (!authState.isLoading && !facultyId) {
      setLoading(false)
    }
  }, [facultyId, authState.isLoading, authState.isAuthenticated])

  const loadCurrentSemester = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/semesters/current`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const currentSem = data.data
          setCurrentSemester({
            name: `${currentSem.academicYear} - Semester ${currentSem.semesterNumber}`,
            academicYear: currentSem.academicYear,
            semesterNumber: currentSem.semesterNumber
          })
        } else {
          setCurrentSemester(null)
        }
      } else {
        setCurrentSemester(null)
      }
    } catch (error) {
      console.error('Error loading current semester:', error)
      setCurrentSemester(null)
    }
  }

  const loadAssignments = async () => {
    if (!facultyId) return
    
    try {
      setLoading(true)
      console.log('🔄 Loading faculty assignments for dashboard:', facultyId)
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/faculty/assignments`, {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Transform backend response to frontend format
        // Backend returns flat array of assignments, frontend expects grouped by section
        const assignmentsBySection = new Map<string, Assignment>()
        
        result.data.forEach((section: any) => {
          if (!section) return
          const sectionId = section.id || 'unknown'
          if (!assignmentsBySection.has(sectionId)) {
            // Format time from meetings
            let timeStr = 'TBD'
            if (section.meetings && section.meetings.length > 0) {
              const meeting = section.meetings[0]
              timeStr = `${meeting.dayOfWeek} ${meeting.startTime} - ${meeting.endTime}`
            }
            
            assignmentsBySection.set(sectionId, {
              id: sectionId,
              course: {
                code: section.course?.code || 'Unknown',
                name: section.course?.name || 'Unknown Course',
              },
              section: section.name || 'Unknown Section',
              time: timeStr,
              room: section.room?.name || 'TBD',
              students: 0,
              assignments: [],
            })
          }
          
          const sectionData = assignmentsBySection.get(sectionId)!
          if (section.assignments && section.assignments.length > 0) {
            section.assignments.forEach((assignment: any) => {
              if (!assignment.student) return
              sectionData.assignments.push({
                id: assignment.id,
                student: {
                  id: assignment.student.id,
                  name: assignment.student.name,
                  email: assignment.student.email,
                },
              })
            })
            sectionData.students = sectionData.assignments.length
          }
        })
        
        const formattedAssignments = Array.from(assignmentsBySection.values())
        setAssignments(formattedAssignments)
        console.log('✅ Loaded dashboard assignments:', formattedAssignments.length, 'sections')
      } else {
        console.error('❌ Error loading assignments:', result.error)
        setAssignments([])
      }
    } catch (error) {
      console.error('❌ Error loading assignments:', error)
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="faculty">
      <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Faculty Dashboard" 
        showBack={false}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentSemester && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-700">Current Semester:</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                {currentSemester.name}
              </span>
            </div>
          </div>
        )}
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
              <Link href="/faculty/assignments" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                My Assignments
              </Link>
              <Link href="/faculty/grades" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Grade Entry
              </Link>
              <Link href="/settings" className="block w-full text-left px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                Settings
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
