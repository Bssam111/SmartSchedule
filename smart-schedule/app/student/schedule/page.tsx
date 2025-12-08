'use client'
import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from '../../../components/AppHeader'
import { useAuth } from '../../../components/AuthProvider'

interface MeetingEntry {
  dayOfWeek: string
  startTime: string
  endTime: string
}

interface Enrollment {
  id: string
  course: {
    code: string
    name: string
    credits?: number
  }
  instructor?: {
    name: string
  } | null
  room?: {
    name: string
  } | null
  meetings: MeetingEntry[]
}

export default function StudentSchedule() {
  const { getCurrentUser, authState } = useAuth()
  const user = getCurrentUser()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadSchedule = async () => {
      if (!user) {
        setEnrollments([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Use the centralized API URL utility
        const { getApiBaseUrl } = await import('@/lib/api-utils')
        const API_BASE_URL = getApiBaseUrl()
        const response = await fetch(`${API_BASE_URL}/students/me/schedule`, {
          credentials: 'include'
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          setErrorMessage(result.error || 'Unable to load schedule.')
          setEnrollments([])
          return
        }

        const enrollmentsData = result.data || []
        console.log('📅 Loaded enrollments:', enrollmentsData.length)
        enrollmentsData.forEach((enrollment: any) => {
          console.log(`  - ${enrollment.course?.code || 'N/A'}: ${enrollment.meetings?.length || 0} meetings`)
          enrollment.meetings?.forEach((meeting: any) => {
            console.log(`    ${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`)
          })
        })
        setEnrollments(enrollmentsData)
        setErrorMessage('')
      } catch (error) {
        console.error('Error loading schedule:', error)
        setErrorMessage('Unable to load schedule. Please try again later.')
        setEnrollments([])
      } finally {
        setLoading(false)
      }
    }

    if (!authState.isLoading) {
      loadSchedule()
    }
  }, [authState.isLoading, user?.id])

  // Helper function to normalize time format (8:00 -> 08:00)
  const normalizeTime = (time: string): string => {
    const parts = time.trim().split(':')
    const hours = parts[0].padStart(2, '0')
    const minutes = parts[1] || '00'
    return `${hours}:${minutes}`
  }

  const scheduleCells = useMemo(() => {
    const cells = enrollments.flatMap(enrollment =>
      (enrollment.meetings || []).map(meeting => {
        const normalizedStart = normalizeTime(meeting.startTime)
        const normalizedEnd = normalizeTime(meeting.endTime)
        return {
          day: meeting.dayOfWeek,
          time: `${normalizedStart}-${normalizedEnd}`,
          rawStart: normalizedStart,
          rawEnd: normalizedEnd,
          course: enrollment.course?.code || 'N/A',
          courseName: enrollment.course?.name || 'Unknown Course',
          room: enrollment.room?.name || 'TBD',
          instructor: enrollment.instructor?.name || 'TBD'
        }
      })
    )
    console.log('📊 Schedule cells created:', cells.length)
    cells.forEach(cell => {
      console.log(`  - ${cell.day} ${cell.time}: ${cell.course}`)
    })
    return cells
  }, [enrollments])

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  // Time slots are 50-minute periods
  const timeSlots = ['08:00-08:50', '09:00-09:50', '10:00-10:50', '11:00-11:50', '12:00-12:50', '13:00-13:50', '14:00-14:50', '15:00-15:50', '16:00-16:50', '17:00-17:50', '18:00-18:50', '19:00-19:50']

  const getScheduleForDayAndTime = (day: string, time: string) => {
    // Normalize the time slot format
    const [slotStartStr, slotEndStr] = time.split('-')
    const normalizedSlotStart = normalizeTime(slotStartStr)
    const normalizedSlotEnd = normalizeTime(slotEndStr)
    const normalizedTime = `${normalizedSlotStart}-${normalizedSlotEnd}`
    
    // Try exact match first (with normalized times)
    let match = scheduleCells.find(entry => {
      return entry.day === day && entry.time === normalizedTime
    })
    
    // If no exact match, try to find meetings that overlap with this time slot
    if (!match) {
      const [slotStart, slotEnd] = normalizedTime.split('-').map(t => {
        const [hours, minutes] = t.split(':').map(Number)
        return hours * 60 + minutes
      })
      
      match = scheduleCells.find(entry => {
        if (entry.day !== day) return false
        
        // Use the raw start/end times that are already normalized
        const meetingStart = entry.rawStart.split(':').map(Number)
        const meetingEnd = entry.rawEnd.split(':').map(Number)
        const meetingStartMinutes = meetingStart[0] * 60 + meetingStart[1]
        const meetingEndMinutes = meetingEnd[0] * 60 + meetingEnd[1]
        
        // Check if meeting overlaps with time slot (meeting starts before slot ends and ends after slot starts)
        return (meetingStartMinutes < slotEnd && meetingEndMinutes > slotStart)
      })
    }
    
    return match
  }
  
  // Get all unique meeting times for display
  const allMeetingTimes = useMemo(() => {
    const times = new Set<string>()
    scheduleCells.forEach(cell => {
      times.add(cell.time)
    })
    return Array.from(times).sort()
  }, [scheduleCells])

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="My Schedule" 
        backFallbackUrl="/student/dashboard"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedule...</p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-sm text-red-600">
            {errorMessage}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    {days.map(day => (
                      <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeSlots.map(time => (
                    <tr key={time}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {time}
                      </td>
                      {days.map(day => {
                        const scheduleItem = getScheduleForDayAndTime(day, time)
                        return (
                          <td key={`${day}-${time}`} className="px-6 py-4 whitespace-nowrap">
                            {scheduleItem ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="text-sm font-medium text-blue-900">{scheduleItem.course}</div>
                                <div className="text-xs text-blue-800 font-medium mt-1">{scheduleItem.time}</div>
                                <div className="text-xs text-blue-700 mt-1">{scheduleItem.room}</div>
                                <div className="text-xs text-blue-600">{scheduleItem.instructor}</div>
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm">Free</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Course List with Times */}
        {enrollments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Course Schedule Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enrollments.flatMap(enrollment =>
                    (enrollment.meetings || []).map((meeting, idx) => (
                      <tr key={`${enrollment.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{enrollment.course?.code || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{enrollment.course?.name || 'Unknown Course'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{meeting.dayOfWeek}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {meeting.startTime} - {meeting.endTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.room?.name || 'TBD'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.instructor?.name || 'TBD'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Schedule Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-blue-600">{enrollments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {enrollments.length > 0 ? 'Active' : 'Draft'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
