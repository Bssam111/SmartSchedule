'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { AppHeader } from '../../../components/AppHeader'
import { showToast } from '../../../components/Toast'

interface Course {
  id: string
  code: string
  name: string
  credits: number
}

interface Faculty {
  id: string
  name: string
  email: string
  universityId?: string
}

interface Section {
  id: string
  name: string
  courseId: string
  course: Course
  instructorId: string
  instructor: Faculty
  roomId?: string
  room?: { name: string; capacity: number }
}

interface Semester {
  id: string
  name: string
  academicYear: string
  semesterNumber: number
  isCurrent: boolean
}

interface CourseFacultyAssignment {
  id: string
  courseId: string
  facultyId: string
  semesterId: string
  course: Course
  faculty: Faculty
}

export default function FacultyAssignmentPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState<CourseFacultyAssignment[]>([])
  const [newFacultyAssignments, setNewFacultyAssignments] = useState<Record<string, string>>({}) // courseId -> facultyId for new assignments

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSemesterId) {
      loadCourseFacultyAssignments(selectedSemesterId)
    }
  }, [selectedSemesterId])

  const loadData = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      const [coursesRes, facultyRes, semestersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/users/instructors`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/semesters`, { credentials: 'include' })
      ])

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        if (data.success) {
          setCourses(data.data || [])
        }
      }

      if (facultyRes.ok) {
        const data = await facultyRes.json()
        if (data.success) {
          setFaculty(data.data || [])
        }
      }

      if (semestersRes.ok) {
        const data = await semestersRes.json()
        if (data.success) {
          const allSemesters = data.data || []
          setSemesters(allSemesters)
          // Set current semester as default
          const currentSem = allSemesters.find((s: Semester) => s.isCurrent)
          if (currentSem) {
            setSelectedSemesterId(currentSem.id)
          } else if (allSemesters.length > 0) {
            setSelectedSemesterId(allSemesters[0].id)
          }
        }
      }

      // Load course-faculty assignments for selected semester if available
      if (selectedSemesterId) {
        loadCourseFacultyAssignments(selectedSemesterId)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCourseFacultyAssignments = async (semesterId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/course-faculty?semesterId=${semesterId}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAssignments(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading course-faculty assignments:', error)
    }
  }

  // Get all faculty members assigned to a course for the selected semester
  const getCourseFaculty = (courseId: string): Faculty[] => {
    return assignments
      .filter(a => a.courseId === courseId)
      .map(a => a.faculty)
  }

  const handleAssignFaculty = async (courseId: string, facultyId: string) => {
    try {
      if (!selectedSemesterId) {
        showToast('Please select a semester first', 'warning')
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/course-faculty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          facultyId,
          semesterId: selectedSemesterId
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        showToast('Faculty assigned to course successfully', 'success')
        // Clear the assignment input
        setNewFacultyAssignments({ ...newFacultyAssignments, [courseId]: '' })
        // Reload assignments
        loadCourseFacultyAssignments(selectedSemesterId)
      } else {
        showToast(data.error || data.message || 'Failed to assign faculty', 'error')
      }
    } catch (error) {
      console.error('Error assigning faculty:', error)
      showToast('Failed to assign faculty', 'error')
    }
  }

  const handleRemoveFaculty = async (courseId: string, facultyId: string) => {
    try {
      if (!selectedSemesterId) {
        showToast('Please select a semester first', 'warning')
        return
      }

      // Confirm removal
      const confirmMessage = 'Are you sure you want to remove this faculty from teaching this course in this semester?'
      if (!globalThis.confirm(confirmMessage)) {
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/course-faculty`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          facultyId,
          semesterId: selectedSemesterId
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        showToast('Faculty removed from course successfully', 'success')
        // Reload assignments
        loadCourseFacultyAssignments(selectedSemesterId)
      } else {
        showToast(data.error || data.message || 'Failed to remove faculty', 'error')
      }
    } catch (error) {
      console.error('Error removing faculty:', error)
      showToast('Failed to remove faculty', 'error')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole={['committee', 'admin']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole={['committee', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Faculty Assignment" showBack={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Faculty Assignment</h1>
            <p className="mt-2 text-gray-600">Assign faculty members to courses by semester. Faculty assigned here can teach the course in this semester.</p>
          </div>

          {/* Semester Selector */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <label htmlFor="semester-select" className="block text-sm font-medium text-gray-900 mb-2">
              Select Semester
            </label>
            <select
              id="semester-select"
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="w-full md:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a semester</option>
              {semesters.map(sem => (
                <option key={sem.id} value={sem.id}>
                  {sem.name} {sem.isCurrent && '(Current)'}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Faculty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Add Faculty
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map(course => {
                    const assignedFaculty = getCourseFaculty(course.id)
                    // Filter out already assigned faculty from dropdown
                    const availableFaculty = faculty.filter(f => 
                      !assignedFaculty.some(af => af.id === f.id)
                    )
                    
                    return (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{course.code}</div>
                          <div className="text-sm text-gray-900">{course.name}</div>
                          <div className="text-xs text-gray-900">{course.credits} credits</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {assignedFaculty.length > 0 ? (
                            <div className="space-y-3">
                              {assignedFaculty.map(fac => (
                                <div key={fac.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{fac.name}</div>
                                      <div className="text-xs text-gray-600 mt-1">{fac.email}</div>
                                      {fac.universityId && (
                                        <div className="text-xs text-gray-500 mt-1">ID: {fac.universityId}</div>
                                      )}
                                      <div className="text-xs text-blue-600 mt-2">
                                        Can teach this course in this semester
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveFaculty(course.id, fac.id)}
                                      className="ml-3 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                      title="Remove faculty from course"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">No faculty assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <select
                              value={newFacultyAssignments[course.id] || ''}
                              onChange={(e) => {
                                setNewFacultyAssignments({ ...newFacultyAssignments, [course.id]: e.target.value })
                              }}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select faculty</option>
                              {availableFaculty.map(f => (
                                <option key={f.id} value={f.id}>
                                  {f.name} {f.universityId && `(${f.universityId})`}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const selectedFaculty = newFacultyAssignments[course.id]
                                if (selectedFaculty) {
                                  handleAssignFaculty(course.id, selectedFaculty)
                                } else {
                                  showToast('Please select a faculty member', 'warning')
                                }
                              }}
                              disabled={!newFacultyAssignments[course.id] || availableFaculty.length === 0}
                              className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                                newFacultyAssignments[course.id] && availableFaculty.length > 0
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Add
                            </button>
                          </div>
                          {availableFaculty.length === 0 && assignedFaculty.length > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                              All available faculty assigned
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

