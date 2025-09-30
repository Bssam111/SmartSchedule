'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDialog } from '../../../../hooks/useDialog'
import { useToast } from '../../../../hooks/useToast'

interface Student {
  id: string
  name: string
  email: string
  universityId: string
}

interface Section {
  id: string
  name: string
  course: {
    code: string
    name: string
  }
  instructor: {
    name: string
  }
  room: {
    name: string
  }
  meetings: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
  assignments: Array<{
    id: string
    student: Student
  }>
}

export default function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const [section, setSection] = useState<Section | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [sectionId, setSectionId] = useState<string | null>(null)
  
  const { confirm } = useDialog()
  const { success, error } = useToast()

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setSectionId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (sectionId) {
      loadData()
    }
  }, [sectionId])

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student => 
        student.universityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStudents(filtered)
    } else {
      // Show all students by default, not just when there's a search term
      setFilteredStudents(students)
    }
  }, [searchTerm, students])

  const loadData = async () => {
    if (!sectionId) return
    
    try {
      setLoading(true)
      
      const [sectionRes, studentsRes] = await Promise.all([
        fetch(`/api/sections/${sectionId}`),
        fetch('/api/students')
      ])

      const [sectionData, studentsData] = await Promise.all([
        sectionRes.json(),
        studentsRes.json()
      ])

      if (sectionData.success) {
        setSection(sectionData.data)
      }

      if (studentsData.success) {
        setStudents(studentsData.data)
        setFilteredStudents(studentsData.data)
      }
    } catch (err) {
      error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const enrollStudent = async (studentId: string, universityId: string) => {
    if (!section) return

    const confirmed = await confirm({
      title: 'Enroll Student',
      message: `Are you sure you want to enroll ${universityId} in ${section.course.code}?`,
      type: 'info'
    })

    if (!confirmed) return

    try {
      setEnrolling(studentId)
      
      const response = await fetch('/api/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId: section.id,
          universityId: universityId
        })
      })

      const result = await response.json()

      if (result.success) {
        success('Student enrolled successfully!')
        loadData() // Reload data
      } else {
        error(result.error || 'Failed to enroll student')
      }
    } catch (err) {
      error('Failed to enroll student')
    } finally {
      setEnrolling(null)
    }
  }

  const unenrollStudent = async (assignmentId: string, studentName: string) => {
    if (!section) return

    const confirmed = await confirm({
      title: 'Unenroll Student',
      message: `Are you sure you want to unenroll ${studentName} from ${section.course.code}?`,
      type: 'warning'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/sections/${section.id}/unenroll?studentId=${assignmentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        success('Student unenrolled successfully!')
        loadData() // Reload data
      } else {
        error(result.error || 'Failed to unenroll student')
      }
    } catch (err) {
      error('Failed to unenroll student')
    }
  }

  const isStudentEnrolled = (studentId: string) => {
    return section?.assignments?.some(assignment => assignment.student.id === studentId) || false
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading section...</p>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Section not found</h1>
          <Link href="/committee/schedules" className="text-blue-600 hover:text-blue-800">
            ← Back to Schedules
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/committee/schedules" className="text-blue-600 hover:text-blue-800">
                ← Back to Schedules
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {section.course.code} - {section.course.name}
                </h1>
                <p className="text-gray-600">
                  {section.instructor.name} • {section.room.name} • {section.meetings.length > 0 ? 
                    section.meetings.map(meeting => `${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`).join(', ') : 
                    'No meetings scheduled'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enrolled Students */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Enrolled Students ({section.assignments?.length || 0})
            </h2>
            {(section.assignments?.length || 0) === 0 ? (
              <p className="text-gray-500 text-center py-4">No students enrolled</p>
            ) : (
              <div className="space-y-3">
                {(section.assignments || []).map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{assignment.student.name}</p>
                      <p className="text-sm text-gray-600">{assignment.student.universityId}</p>
                    </div>
                    <button
                      onClick={() => unenrollStudent(assignment.student.id, assignment.student.name)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Unenroll
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Students */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Available Students ({filteredStudents.length})
            </h2>
            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by University ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {filteredStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {searchTerm ? 'No students found matching your search' : 'Loading students...'}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStudents.map(student => {
                  const isEnrolled = isStudentEnrolled(student.id)
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.universityId}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                      <button
                        onClick={() => enrollStudent(student.id, student.universityId)}
                        disabled={isEnrolled || enrolling === student.id}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          isEnrolled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : enrolling === student.id
                            ? 'bg-blue-300 text-blue-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isEnrolled ? 'Enrolled' : enrolling === student.id ? 'Enrolling...' : 'Enroll'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
