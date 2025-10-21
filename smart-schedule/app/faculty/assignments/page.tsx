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

export default function FacultyAssignments() {
  const { getCurrentUser, authState } = useAuth()
  const user = getCurrentUser()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  
  // Get faculty ID from authenticated user (now maps to database ID)
  const facultyId = user?.id
  
  // Debug logging with request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`[${requestId}] 🔍 Faculty Assignments - User object:`, user)
  console.log(`[${requestId}] 🔍 Faculty Assignments - Faculty ID:`, facultyId)
  console.log(`[${requestId}] 🔍 Faculty Assignments - Auth state:`, authState)
  

  useEffect(() => {
    // Only load assignments if auth is not loading, user is authenticated, and we have a faculty ID
    if (!authState.isLoading && authState.isAuthenticated && facultyId) {
      loadAssignments()
    } else if (!authState.isLoading && !authState.isAuthenticated) {
      setLoading(false)
    } else if (!authState.isLoading && !facultyId) {
      setLoading(false)
    }
  }, [facultyId, authState.isLoading, authState.isAuthenticated])

  // Listen for section creation events to refresh assignments
  useEffect(() => {
    const handleSectionCreated = (event: CustomEvent) => {
      const { instructorId } = event.detail
      
      // Only refresh if the section was created for this faculty member
      if (instructorId === facultyId) {
        loadAssignments()
      }
    }

    // Also refresh when the page becomes visible (in case user navigates here after section creation)
    const handleVisibilityChange = () => {
      if (!document.hidden && facultyId) {
        loadAssignments()
      }
    }

    window.addEventListener('sectionCreated', handleSectionCreated as EventListener)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('sectionCreated', handleSectionCreated as EventListener)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [facultyId])

  const loadAssignments = async () => {
    const loadRequestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    if (!facultyId) {
      console.log(`[${loadRequestId}] ❌ No faculty ID available for loading assignments`)
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      console.log(`[${loadRequestId}] 🔄 Loading assignments for faculty ID:`, facultyId)
      
      const timestamp = Date.now()
      const apiUrl = `/api/faculty/assignments?facultyId=${facultyId}&t=${timestamp}`
      console.log(`[${loadRequestId}] 🔄 API URL:`, apiUrl)
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch(apiUrl, { signal: controller.signal })
      clearTimeout(timeoutId)
      
      console.log(`[${loadRequestId}] 🔄 Response status:`, response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log(`[${loadRequestId}] 📋 Faculty assignments response:`, result)
      
      if (result.success) {
        setAssignments(result.data)
        console.log(`[${loadRequestId}] ✅ Loaded assignments:`, result.data.length, 'assignments')
      } else {
        console.error(`[${loadRequestId}] ❌ Error loading assignments:`, result.error)
        setAssignments([]) // Clear assignments on error
      }
    } catch (error) {
      console.error(`[${loadRequestId}] ❌ Error loading assignments:`, error)
      setAssignments([]) // Clear assignments on error
      
      // Show error message to user
      if (error.name === 'AbortError') {
        console.error(`[${loadRequestId}] ⏰ Request timed out after 15 seconds`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Add refresh function that can be called externally
  const refreshAssignments = () => {
    loadAssignments()
  }

  return (
    <ProtectedRoute requiredRole="faculty">
      <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="My Assignments" 
        backFallbackUrl="/faculty/dashboard"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {authState.isLoading || loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {authState.isLoading ? 'Loading authentication...' : 'Loading assignments...'}
              </p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't been assigned to any courses yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {assignment.course.code} - {assignment.course.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Section {assignment.section} • {assignment.time} • {assignment.room}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {assignment.students} students
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Student Roster</h4>
                  {assignment.assignments.length === 0 ? (
                    <p className="text-sm text-gray-500">No students assigned yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignment.assignments.map((studentAssignment) => (
                        <div key={studentAssignment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {studentAssignment.student.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {studentAssignment.student.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {studentAssignment.student.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  )
}
