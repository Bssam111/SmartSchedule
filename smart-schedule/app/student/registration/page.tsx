'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { AppHeader } from '../../../components/AppHeader'
import { useAuth } from '../../../components/AuthProvider'
import { useToast, showToast } from '../../../components/Toast'

interface Course {
  id: string
  code: string
  name: string
  credits: number
  prerequisites?: Array<{ prerequisiteCourse: { code: string; name: string } }>
}

interface Section {
  id: string
  name: string
  course: Course
  instructor: { name: string }
  room?: { name: string }
  meetings: Array<{ dayOfWeek: string; startTime: string; endTime: string }>
}

interface RegistrationWindow {
  id: string
  startDate: string
  endDate: string
  isOpen: boolean
  allowAddDrop: boolean
  maxStudentCapacity: number
  semester: { number: number; name: string }
}

export default function RegistrationPage() {
  const { getCurrentUser } = useAuth()
  const user = getCurrentUser()
  const [registrationWindow, setRegistrationWindow] = useState<RegistrationWindow | null>(null)
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    loadRegistrationWindow()
    loadEnrollments()
  }, [user?.id])

  useEffect(() => {
    if (selectedCourse) {
      loadSections(selectedCourse)
    }
  }, [selectedCourse])

  const loadRegistrationWindow = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/semesters/registration-windows/active`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setRegistrationWindow(data.data)
          if (data.data.isOpen) {
            loadAvailableCourses()
          }
        }
      }
    } catch (error) {
      console.error('Error loading registration window:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableCourses = async () => {
    // TODO: Implement API endpoint to get available courses for student
    // For now, we'll use a placeholder
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/courses`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableCourses(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const loadSections = async (courseId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/sections?courseId=${courseId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSections(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    }
  }

  const loadEnrollments = async () => {
    if (!user?.id) return

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/enrollment/student/${user.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEnrollments(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading enrollments:', error)
    }
  }

  const handleEnroll = async (sectionId: string, courseId: string) => {
    if (!registrationWindow?.isOpen) {
      showToast('Registration window is not open', 'error')
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/enrollment/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sectionId, courseId })
      })

      if (response.ok) {
        showToast('Successfully enrolled in course', 'success')
        loadEnrollments()
        setSelectedCourse(null)
        setSections([])
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to enroll', 'error')
      }
    } catch (error) {
      showToast('Failed to enroll in course', 'error')
    }
  }

  const handleDrop = async (sectionId: string) => {
    if (!registrationWindow?.isOpen || !registrationWindow?.allowAddDrop) {
      showToast('Cannot drop courses at this time', 'error')
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/enrollment/drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sectionId })
      })

      if (response.ok) {
        showToast('Successfully dropped course', 'success')
        loadEnrollments()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to drop course', 'error')
      }
    } catch (error) {
      showToast('Failed to drop course', 'error')
    }
  }

  const canEnroll = registrationWindow?.isOpen && registrationWindow?.allowAddDrop

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Course Registration" showBack={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Course Registration</h1>
            <p className="mt-2 text-gray-600">Add or drop courses during the registration window</p>
          </div>

          {/* Registration Window Status */}
          <div className={`rounded-lg border p-4 mb-6 ${
            registrationWindow?.isOpen
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            {registrationWindow ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${
                      registrationWindow.isOpen ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {registrationWindow.isOpen ? 'Registration Window Open' : 'Registration Window Closed'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(registrationWindow.startDate).toLocaleString()} - {new Date(registrationWindow.endDate).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    registrationWindow.isOpen
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {registrationWindow.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-yellow-800">No active registration window</p>
            )}
          </div>

          {/* Current Enrollments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Enrollments</h2>
            {enrollments.length === 0 ? (
              <p className="text-gray-500">No courses enrolled</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map(enrollment => (
                  <div key={enrollment.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {enrollment.course.code} - {enrollment.course.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Section: {enrollment.section.name} | {enrollment.course.credits} credits
                      </p>
                    </div>
                    {canEnroll && (
                      <button
                        onClick={() => handleDrop(enrollment.sectionId)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Drop
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Courses */}
          {canEnroll && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Courses</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
                <select
                  value={selectedCourse || ''}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Select a course</option>
                  {availableCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name} ({course.credits} credits)
                    </option>
                  ))}
                </select>
              </div>

              {selectedCourse && sections.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Available Sections</h3>
                  <div className="space-y-3">
                    {sections.map(section => (
                      <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{section.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Instructor: {section.instructor.name}
                              {section.room && ` | Room: ${section.room.name}`}
                            </p>
                            {section.meetings.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                {section.meetings.map(m => `${m.dayOfWeek} ${m.startTime}-${m.endTime}`).join(', ')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleEnroll(section.id, section.course.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Enroll
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

