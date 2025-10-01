'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDialog } from '../../../components/DialogProvider'
import { useToast } from '../../../hooks/useToast'

interface Section {
  id: string
  course: {
    id: string
    code: string
    name: string
  }
  instructor: {
    id: string
    name: string
  }
  room: {
    id: string
    name: string
  }
  meetings: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
  }>
  capacity: number
  assignments: Array<{
    student: {
      id: string
      name: string
    }
  }>
}

interface Course {
  id: string
  code: string
  name: string
}

interface User {
  id: string
  name: string
}

interface Room {
  id: string
  name: string
}

interface TimeSlot {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

export default function CommitteeSchedules() {
  const { showDialog, confirm } = useDialog()
  const { success, error, warning } = useToast()
  const [sections, setSections] = useState<Section[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<User[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)
  const [newSection, setNewSection] = useState({
    courseId: '',
    instructorId: '',
    roomId: '',
    capacity: 30,
    selectedDays: [] as string[],
    selectedTimeSlots: {} as Record<string, string[]>
  })
  const [enrollmentData, setEnrollmentData] = useState({
    universityId: '',
    scheduleId: ''
  })
  const [searchResult, setSearchResult] = useState<any>(null)
  const [formError, setFormError] = useState<string>('')

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Prevent hydration mismatch by ensuring client-side rendering
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // First, ensure time slots are generated
      try {
        await fetch('/api/timeslots/generate', { method: 'POST' })
      } catch (error) {
        console.log('Time slots may already exist, continuing...')
      }
      
      // Load all data in parallel
      const [sectionsRes, coursesRes, instructorsRes, roomsRes, timeSlotsRes, studentsRes, schedulesRes] = await Promise.all([
        fetch('/api/sections'),
        fetch('/api/courses'),
        fetch('/api/users'),
        fetch('/api/rooms'),
        fetch('/api/timeslots'),
        fetch('/api/students'),
        fetch('/api/schedules')
      ])

      // Check each response
      const responses = [
        { res: sectionsRes, name: 'sections' },
        { res: coursesRes, name: 'courses' },
        { res: instructorsRes, name: 'instructors' },
        { res: roomsRes, name: 'rooms' },
        { res: timeSlotsRes, name: 'timeSlots' },
        { res: studentsRes, name: 'students' },
        { res: schedulesRes, name: 'schedules' }
      ]

      for (const { res, name } of responses) {
        if (!res.ok) {
          console.error(`Failed to fetch ${name}:`, res.status, res.statusText)
        }
      }

      const [sectionsData, coursesData, instructorsData, roomsData, timeSlotsData, studentsData, schedulesData] = await Promise.all([
        sectionsRes.json().catch(() => ({ success: false, data: [] })),
        coursesRes.json().catch(() => ({ success: false, data: [] })),
        instructorsRes.json().catch(() => ({ success: false, data: [] })),
        roomsRes.json().catch(() => ({ success: false, data: [] })),
        timeSlotsRes.json().catch(() => ({ success: false, data: [] })),
        studentsRes.json().catch(() => ({ success: false, data: [] })),
        schedulesRes.json().catch(() => ({ success: false, data: [] }))
      ])

      if (sectionsData.success) setSections(sectionsData.data)
      if (coursesData.success) setCourses(coursesData.data)
      if (instructorsData.success) setInstructors(instructorsData.data)
      if (roomsData.success) setRooms(roomsData.data)
      if (timeSlotsData.success) setTimeSlots(timeSlotsData.data)
      if (studentsData.success) setStudents(studentsData.data)
      if (schedulesData.success) setSchedules(schedulesData.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSection = async () => {
    if (!newSection.courseId || !newSection.instructorId || !newSection.roomId || newSection.selectedDays.length === 0) {
      showDialog({
        title: 'Missing Fields',
        message: 'Please fill in all required fields and select at least one day',
        type: 'warning'
      })
      return
    }

    // Check if all selected days have time slots
    const hasTimeSlots = newSection.selectedDays.every(day => 
      newSection.selectedTimeSlots[day] && newSection.selectedTimeSlots[day].length > 0
    )

    if (!hasTimeSlots) {
      showDialog({
        title: 'Missing Time Slots',
        message: 'Please select time slots for all selected days',
        type: 'warning'
      })
      return
    }

    try {
      // Build meetings array from selected days and time slots
      const meetings = []
      for (const day of newSection.selectedDays) {
        const timeSlots = newSection.selectedTimeSlots[day] || []
        for (const timeSlot of timeSlots) {
          const [startTime, endTime] = timeSlot.split('-')
          meetings.push({
            dayOfWeek: day,
            startTime,
            endTime
          })
        }
      }

      const requestData = {
        courseId: newSection.courseId,
        instructorId: newSection.instructorId,
        roomId: newSection.roomId,
        capacity: newSection.capacity,
        meetings
      }

      console.log('📝 Frontend sending data:', JSON.stringify(requestData, null, 2))
      console.log('📝 Selected days:', newSection.selectedDays)
      console.log('📝 Selected time slots:', newSection.selectedTimeSlots)
      console.log('📝 Built meetings:', meetings)

      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json()
        console.log('❌ Server error response:', errorData)
        console.log('❌ Error data type:', typeof errorData)
        console.log('❌ Error data keys:', Object.keys(errorData))
        console.log('❌ Conflict type:', errorData.conflictType)
        console.log('❌ Conflict details:', errorData.conflictDetails)
        
        // Show user-friendly error message with specific conflict details
        if (errorData.conflictType === 'faculty_schedule' && errorData.conflictDetails) {
          const { day, time, existingCourse, instructor } = errorData.conflictDetails
          
          // Set form error for inline display
          setFormError(`⚠️ ${instructor} already has a meeting on ${day} at ${time}. Existing course: ${existingCourse}`)
          
          showDialog({
            title: 'Faculty Schedule Conflict',
            message: `⚠️ **Instructor Conflict Detected**\n\n${instructor} already has a meeting on **${day}** at **${time}**.\n\n**Existing Course:** ${existingCourse}\n\nPlease choose a different time slot or day to avoid conflicts.`,
            type: 'warning',
            confirmText: 'Choose Different Time',
            onConfirm: () => {
              // Focus on the time selection area
              const timeSlotContainer = document.querySelector('[data-testid="time-selection"]')
              if (timeSlotContainer) {
                timeSlotContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
          })
          
          // Also show toast with specific details
          warning(`Faculty conflict: ${instructor} has existing meeting on ${day} at ${time}`)
          return // Don't throw error, just return to stop execution
        } else if (errorData.conflictType === 'faculty_availability' && errorData.conflictDetails) {
          const { day, time, instructor, reason } = errorData.conflictDetails
          
          // Set form error for inline display
          setFormError(`🚫 ${instructor} is not available on ${day} at ${time}. ${reason}`)
          
          showDialog({
            title: 'Faculty Availability Conflict',
            message: `🚫 **Faculty Availability Conflict**\n\n**${instructor}** is not available on **${day}** at **${time}**.\n\n**Reason:** ${reason}\n\nPlease choose a different time slot that aligns with the faculty member's availability.`,
            type: 'warning',
            confirmText: 'Choose Different Time',
            onConfirm: () => {
              // Focus on the time selection area
              const timeSlotContainer = document.querySelector('[data-testid="time-selection"]')
              if (timeSlotContainer) {
                timeSlotContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
          })
          warning(`Faculty availability conflict: ${instructor} not available on ${day} at ${time}`)
          return
        } else if (errorData.conflictType === 'room_schedule' && errorData.conflictDetails) {
          const { day, time, existingCourse, instructor, room } = errorData.conflictDetails
          
          // Set form error for inline display
          setFormError(`🏢 Room ${room} is already occupied on ${day} at ${time}. Existing course: ${existingCourse}`)
          
          showDialog({
            title: 'Room Schedule Conflict',
            message: `🏢 **Room Conflict Detected**\n\nRoom **${room}** is already occupied on **${day}** at **${time}**.\n\n**Existing Course:** ${existingCourse}\n**Instructor:** ${instructor}\n\nPlease select a different room or time slot.`,
            type: 'warning',
            confirmText: 'Choose Different Room',
            onConfirm: () => {
              // Focus on the room selection
              const roomSelect = document.querySelector('select[name="roomId"]')
              if (roomSelect) {
                (roomSelect as HTMLSelectElement).focus()
                roomSelect.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
          })
          warning(`Room conflict: ${room} is occupied on ${day} at ${time}`)
          return
        } else if (errorData.error && errorData.error.includes('Faculty already has a meeting')) {
          // Fallback for old error format
          const conflictMatch = errorData.error.match(/Faculty already has a meeting on (\w+) at (\d{2}:\d{2})-(\d{2}:\d{2})/)
          const day = conflictMatch ? conflictMatch[1] : 'the selected day'
          const startTime = conflictMatch ? conflictMatch[2] : 'the selected time'
          const endTime = conflictMatch ? conflictMatch[3] : 'the selected time'
          
          // Set form error for inline display
          setFormError(`⚠️ Instructor already has a meeting on ${day} at ${startTime}-${endTime}`)
          
          showDialog({
            title: 'Schedule Conflict Detected',
            message: `⚠️ This instructor already has a meeting on ${day} at ${startTime}-${endTime}.\n\nPlease choose a different time slot or day to avoid conflicts.`,
            type: 'warning',
            confirmText: 'Choose Different Time',
            onConfirm: () => {
              // Focus on the time selection area
              const timeSlotContainer = document.querySelector('[data-testid="time-selection"]')
              if (timeSlotContainer) {
                timeSlotContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
          })
          
          // Also show toast with specific details
          warning(`Schedule conflict: Instructor has existing meeting on ${day} at ${startTime}-${endTime}`)
          return // Don't throw error, just return to stop execution
        } else if (errorData.error && errorData.error.includes('Room already occupied')) {
          showDialog({
            title: 'Room Conflict',
            message: `🏢 The selected room is already occupied at the chosen time.\n\nPlease select a different room or time slot.`,
            type: 'warning',
            confirmText: 'Choose Different Room',
            onConfirm: () => {
              // Focus on the room selection
              const roomSelect = document.querySelector('select[name="roomId"]')
              if (roomSelect) {
                (roomSelect as HTMLSelectElement).focus()
                roomSelect.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }
          })
          warning('Room conflict: Selected room is already occupied at this time')
          return
        } else if (errorData.error && errorData.error.includes('Student time conflict')) {
          showDialog({
            title: 'Student Schedule Conflict',
            message: `👥 There are students with conflicting schedules.\n\nPlease review the student assignments and choose a different time.`,
            type: 'warning'
          })
          warning('Student schedule conflict detected')
          return
        } else {
          // Generic error handling - always show something
          console.log('❌ Falling back to generic error handling')
          
          // Set form error for inline display
          setFormError(`❌ ${errorData.error || 'An error occurred while creating the section.'}`)
          
          showDialog({
            title: 'Error Creating Section',
            message: errorData.error || 'An error occurred while creating the section.',
            type: 'error',
            confirmText: 'Try Again'
          })
          // Also show toast as backup
          error(errorData.error || 'An error occurred while creating the section.')
          return // Don't throw error, just return to stop execution
        }
      }

      // Check if response has content
      const text = await response.text()
      if (!text) {
        throw new Error('Empty response from server')
      }

      let result
      try {
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', text)
        showDialog({
          title: 'Server Error',
          message: 'The server returned an invalid response. Please try again.',
          type: 'error'
        })
        error('Server returned invalid response. Please try again.')
        return
      }
      
      if (result.success) {
        // Add the new section to the local state immediately
        setSections(prev => [...prev, result.data])
        
        setNewSection({ 
          courseId: '', 
          instructorId: '', 
          roomId: '', 
          capacity: 30,
          selectedDays: [],
          selectedTimeSlots: {}
        })
        setShowAddModal(false)
        success('Section created successfully!')
      } else {
        error('Error creating section: ' + result.error)
      }
    } catch (err) {
      console.error('Error creating section:', err)
      error('Error creating section: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const removeSection = async (id: string) => {
    console.log('🗑️ Remove section clicked for ID:', id)
    console.log('🗑️ useDialog hook:', { showDialog, confirm })
    console.log('🗑️ About to call confirm dialog...')
    
    let confirmed = false
    try {
      confirmed = await confirm({
        title: 'Delete Section',
        message: 'Are you sure you want to delete this section?',
        type: 'warning'
      })
      
      console.log('🗑️ Confirmation result:', confirmed)
    } catch (error) {
      console.error('🗑️ Error in confirm dialog:', error)
      return
    }
    
    if (!confirmed) {
      console.log('🗑️ User cancelled deletion')
      return
    }

    try {
      console.log('🗑️ Sending DELETE request to:', `/api/sections/${id}`)
      const response = await fetch(`/api/sections/${id}`, {
        method: 'DELETE',
      })

      console.log('🗑️ DELETE response status:', response.status)
      const result = await response.json()
      console.log('🗑️ DELETE response data:', result)
      
      if (result.success) {
        // Remove the section from local state immediately
        console.log('🗑️ Removing section from local state')
        setSections(prev => prev.filter(section => section.id !== id))
        success('Section deleted successfully!')
      } else {
        console.log('🗑️ Delete failed:', result.error)
        error('Error deleting section: ' + result.error)
      }
    } catch (error) {
      console.error('🗑️ Error deleting section:', error)
      error('Error deleting section')
    }
  }

  const searchStudent = async () => {
    if (!enrollmentData.universityId) {
      showDialog({
        title: 'Missing University ID',
        message: 'Please enter a University ID',
        type: 'warning'
      })
      return
    }

    try {
      const response = await fetch(`/api/students/search?universityId=${enrollmentData.universityId}`)
      const result = await response.json()

      if (result.success) {
        setSearchResult(result.data)
      } else {
        setSearchResult(null)
        error('Student not found: ' + result.error)
      }
    } catch (error) {
      console.error('Error searching student:', error)
      error('Error searching student: ' + error.message)
    }
  }

  const enrollStudent = async () => {
    if (!enrollmentData.universityId || !enrollmentData.scheduleId) {
      showDialog({
        title: 'Missing Information',
        message: 'Please enter University ID and select a schedule',
        type: 'warning'
      })
      return
    }

    if (!selectedSection) {
      showDialog({
        title: 'No Section Selected',
        message: 'No section selected',
        type: 'warning'
      })
      return
    }

    if (!searchResult) {
      showDialog({
        title: 'Student Not Found',
        message: 'Please search for the student first',
        type: 'warning'
      })
      return
    }

    try {
      const response = await fetch(`/api/sections/${selectedSection.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrollmentData)
      })

      const result = await response.json()

      if (result.success) {
        setEnrollmentData({ universityId: '', scheduleId: '' })
        setSearchResult(null)
        setShowEnrollModal(false)
        setSelectedSection(null)
        loadData() // Reload data
        success('Student enrolled successfully!')
      } else {
        error('Error enrolling student: ' + result.error)
      }
    } catch (error) {
      console.error('Error enrolling student:', error)
      error('Error enrolling student: ' + error.message)
    }
  }

  const unenrollStudent = async (sectionId: string, studentId: string) => {
    const confirmed = await confirm({
      title: 'Unenroll Student',
      message: 'Are you sure you want to unenroll this student?',
      type: 'warning'
    })
    
    if (confirmed) {
      try {
        const response = await fetch(`/api/sections/${sectionId}/unenroll?studentId=${studentId}`, {
          method: 'DELETE'
        })
        const result = await response.json()

        if (result.success) {
          loadData() // Reload data
          success('Student unenrolled successfully!')
        } else {
          error('Error unenrolling student: ' + result.error)
        }
      } catch (error) {
        console.error('Error unenrolling student:', error)
        error('Error unenrolling student: ' + error.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/committee/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Draft Schedules</h1>
            </div>
            <button
              onClick={() => {
                setShowAddModal(true)
                setFormError('') // Clear any previous errors
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Section</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!mounted || loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Loading sections...
                    </td>
                  </tr>
                ) : sections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No sections found. Add your first section!
                    </td>
                  </tr>
                ) : (
                  sections.map(section => (
                    <tr key={section.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {section.course.code} - {section.course.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Section {section.id.slice(-3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {section.instructor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {section.room.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {section.meetings && section.meetings.length > 0 ? (
                          <div className="space-y-1">
                            {section.meetings.map((meeting, index) => (
                              <div key={index} className="text-xs">
                                {meeting.dayOfWeek} {meeting.startTime}-{meeting.endTime}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No meetings</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {section.assignments?.length || 0} / {section.capacity || 30}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSection(section)
                            setShowEnrollModal(true)
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 rounded-md transition-colors cursor-pointer mr-2"
                        >
                          Enroll Students
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('🗑️ Remove button clicked for section:', section.id)
                            console.log('🗑️ Button event:', e)
                            removeSection(section.id)
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 rounded-md transition-colors cursor-pointer"
                          type="button"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Sections</h3>
            <p className="text-3xl font-bold text-blue-600">{sections.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-green-600">
              {sections.reduce((sum, s) => sum + (s.assignments?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unique Instructors</h3>
            <p className="text-3xl font-bold text-purple-600">
              {new Set(sections.map(s => s.instructor?.id).filter(Boolean)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Section</h3>
            
            {/* Error Display */}
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{formError}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select
                  id="course-select"
                  value={newSection.courseId}
                  onChange={(e) => {
                    setNewSection({...newSection, courseId: e.target.value})
                    setFormError('') // Clear error when user makes changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="instructor-select" className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                <select
                  id="instructor-select"
                  value={newSection.instructorId}
                  onChange={(e) => setNewSection({...newSection, instructorId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="room-select" className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                <select
                  id="room-select"
                  value={newSection.roomId}
                  onChange={(e) => setNewSection({...newSection, roomId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newSection.selectedDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSection(prev => ({
                              ...prev,
                              selectedDays: [...prev.selectedDays, day],
                              selectedTimeSlots: { ...prev.selectedTimeSlots, [day]: [] }
                            }))
                          } else {
                            setNewSection(prev => ({
                              ...prev,
                              selectedDays: prev.selectedDays.filter(d => d !== day),
                              selectedTimeSlots: { ...prev.selectedTimeSlots, [day]: [] }
                            }))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Slots for Selected Days */}
              <div data-testid="time-selection">
                {newSection.selectedDays.map(day => (
                  <div key={day}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{day} Time Slots *</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {timeSlots
                      .filter(ts => ts.dayOfWeek === day)
                      .map(timeSlot => (
                        <label key={timeSlot.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newSection.selectedTimeSlots[day]?.includes(`${timeSlot.startTime}-${timeSlot.endTime}`) || false}
                            onChange={(e) => {
                              const timeSlotStr = `${timeSlot.startTime}-${timeSlot.endTime}`
                              if (e.target.checked) {
                                setNewSection(prev => ({
                                  ...prev,
                                  selectedTimeSlots: {
                                    ...prev.selectedTimeSlots,
                                    [day]: [...(prev.selectedTimeSlots[day] || []), timeSlotStr]
                                  }
                                }))
                              } else {
                                setNewSection(prev => ({
                                  ...prev,
                                  selectedTimeSlots: {
                                    ...prev.selectedTimeSlots,
                                    [day]: (prev.selectedTimeSlots[day] || []).filter(ts => ts !== timeSlotStr)
                                  }
                                }))
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{timeSlot.startTime}-{timeSlot.endTime}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label htmlFor="capacity-input" className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  id="capacity-input"
                  type="number"
                  value={newSection.capacity}
                  onChange={(e) => setNewSection({...newSection, capacity: parseInt(e.target.value) || 30})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="30"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setFormError('') // Clear error when modal is closed
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addSection}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollModal && selectedSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enroll Students in {selectedSection.course.code} - {selectedSection.course.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="university-id-input" className="block text-sm font-medium text-gray-700 mb-1">University ID</label>
                <div className="flex space-x-2">
                  <input
                    id="university-id-input"
                    type="text"
                    value={enrollmentData.universityId}
                    onChange={(e) => setEnrollmentData({...enrollmentData, universityId: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter University ID (e.g., STU000001)"
                  />
                  <button
                    onClick={searchStudent}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Search
                  </button>
                </div>
                {searchResult && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Found:</strong> {searchResult.name} ({searchResult.email}) - {searchResult.universityId}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="schedule-select" className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                <select
                  id="schedule-select"
                  value={enrollmentData.scheduleId}
                  onChange={(e) => setEnrollmentData({...enrollmentData, scheduleId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a schedule</option>
                  {schedules.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name} ({schedule.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEnrollModal(false)
                  setSelectedSection(null)
                  setEnrollmentData({ universityId: '', scheduleId: '' })
                  setSearchResult(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={enrollStudent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Enroll Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
