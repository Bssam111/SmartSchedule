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
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${API_BASE_URL}/students/me/schedule`, {
          credentials: 'include'
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          setErrorMessage(result.error || 'Unable to load schedule.')
          setEnrollments([])
          return
        }

        setEnrollments(result.data || [])
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

  const scheduleCells = useMemo(() => {
    return enrollments.flatMap(enrollment =>
      (enrollment.meetings || []).map(meeting => ({
        day: meeting.dayOfWeek,
        time: `${meeting.startTime}-${meeting.endTime}`,
        course: enrollment.course.code,
        courseName: enrollment.course.name,
        room: enrollment.room?.name || 'TBD',
        instructor: enrollment.instructor?.name || 'TBD'
      }))
    )
  }, [enrollments])

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const timeSlots = ['08:00-08:50', '09:00-09:50', '10:00-10:50', '11:00-11:50', '13:00-13:50', '14:00-14:50', '15:00-15:50', '16:00-16:50', '17:00-17:50', '18:00-18:50', '19:00-19:50']

  const getScheduleForDayAndTime = (day: string, time: string) => {
    return scheduleCells.find(entry => entry.day === day && entry.time === time)
  }

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
                                <div className="text-xs text-blue-700">{scheduleItem.room}</div>
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

        {/* Schedule Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Courses</h3>
            <p className="text-3xl font-bold text-blue-600">{enrollments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Hours</h3>
            <p className="text-3xl font-bold text-green-600">{scheduleCells.length * 2}</p>
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
