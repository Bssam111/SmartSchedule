'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'
import { AppHeader } from '../../../components/AppHeader'

interface Enrollment {
  id: string
  createdAt: string
  section: {
    id: string
    capacity: number
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
    meetings: Array<{
      id: string
      dayOfWeek: string
      startTime: string
      endTime: string
    }>
  }
}

const summaryIcons = {
  courses: (
    <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10" />
    </svg>
  ),
  credits: (
    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.305 0 2.417.835 2.83 2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12" />
    </svg>
  ),
  status: (
    <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function StudentDashboard() {
  const { getCurrentUser, authState } = useAuth()
  const user = getCurrentUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const timeSlots = [
    '08:00-08:50',
    '09:00-09:50',
    '10:00-10:50',
    '11:00-11:50',
    '13:00-13:50',
    '14:00-14:50',
    '15:00-15:50',
    '16:00-16:50',
    '17:00-17:50'
  ]

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) {
        setEnrollments([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${API_BASE_URL}/students/me/enrollments`, {
          credentials: 'include'
        })
        const data = await response.json()

        if (!response.ok) {
          const errorMsg = data.error || data.message || 'Failed to load enrolled courses.'
          console.error('❌ Enrollment error:', errorMsg, 'Status:', response.status)
          setErrorMessage(errorMsg)
          setEnrollments([])
          return
        }

        if (!data.success) {
          setErrorMessage(data.error || 'Failed to load enrolled courses.')
          setEnrollments([])
          return
        }

        setEnrollments(data.data || [])
        setErrorMessage('')
      } catch (error) {
        console.error('Error loading enrollments:', error)
        setErrorMessage('Unable to load enrolled courses. Please try again later.')
        setEnrollments([])
      } finally {
        setLoading(false)
      }
    }

    if (!authState.isLoading) {
      loadEnrollments()
    }
  }, [authState.isLoading, user?.id])

  const totalCredits = useMemo(() => {
    return enrollments.reduce((sum, enrollment) => {
      const credits = enrollment.section.course.credits || 0
      return sum + credits
    }, 0)
  }, [enrollments])

  const nextCourses = useMemo(() => {
    return enrollments.slice(0, 3)
  }, [enrollments])

  const scheduleCells = useMemo(() => {
    return enrollments.flatMap(enrollment =>
      (enrollment.section.meetings || []).map(meeting => ({
        day: meeting.dayOfWeek,
        time: `${meeting.startTime}-${meeting.endTime}`,
        course: enrollment.section.course.code,
        courseName: enrollment.section.course.name,
        room: enrollment.section.room?.name || 'TBD',
        instructor: enrollment.section.instructor?.name || 'TBD'
      }))
    )
  }, [enrollments])

  const getScheduleForDayAndTime = (day: string, time: string) =>
    scheduleCells.find(cell => cell.day === day && cell.time === time)

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Student Dashboard" showBack={false} />

        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="font-medium">University ID:</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">
                  {user?.universityId || 'STU000001'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">College:</span>
                <span>College of Computer Science</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Major:</span>
                <span>Computer Science</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Hero */} 
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Student Workspace</p>
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">Welcome back, {user?.name || 'Student'}</h2>
                <p className="mt-2 text-white/80">
                  Track enrollments, stay on top of upcoming classes, and monitor your schedule—updated in real time whenever the committee makes changes.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/student/schedule"
                  className="inline-flex items-center px-5 py-3 bg-white/20 border border-white/20 rounded-xl backdrop-blur text-sm font-semibold hover:bg-white/30 transition-colors"
                >
                  View Full Schedule
                </Link>
                <Link
                  href="/student/preferences"
                  className="inline-flex items-center px-5 py-3 bg-white text-blue-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Update Preferences
                </Link>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-slate-50 rounded-2xl p-3">{summaryIcons.courses}</div>
              <div>
                <p className="text-sm text-slate-500">Enrolled Courses</p>
                <p className="text-3xl font-bold text-slate-900">{enrollments.length}</p>
                <p className="text-xs text-slate-400">Current semester</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-slate-50 rounded-2xl p-3">{summaryIcons.credits}</div>
              <div>
                <p className="text-sm text-slate-500">Credits</p>
                <p className="text-3xl font-bold text-slate-900">{totalCredits}</p>
                <p className="text-xs text-slate-400">Earned from enrollments</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="bg-slate-50 rounded-2xl p-3">{summaryIcons.status}</div>
              <div>
                <p className="text-sm text-slate-500">Schedule Status</p>
                <p className="text-3xl font-bold text-slate-900">{enrollments.length > 0 ? 'Active' : 'Draft'}</p>
                <p className="text-xs text-slate-400">
                  {enrollments.length > 0 ? 'Classes confirmed' : 'Awaiting assignments'}
                </p>
              </div>
            </div>
          </div>

          {/* Current Courses */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Current Courses</h3>
                <p className="text-sm text-slate-500">Your assigned sections update instantly after enrollment.</p>
              </div>
            </div>
            {loading ? (
              <div className="py-6 text-center text-gray-500">Loading enrolled courses...</div>
            ) : errorMessage ? (
              <div className="py-4 text-sm text-red-600">{errorMessage}</div>
            ) : enrollments.length === 0 ? (
              <div className="py-4 text-sm text-gray-600">No courses assigned yet. Contact the committee for enrollment.</div>
            ) : (
              <div className="space-y-4 mt-4">
                {enrollments.map(enrollment => (
                  <div
                    key={enrollment.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between border border-gray-100 rounded-xl p-4 bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {enrollment.section.course.code} · {enrollment.section.course.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Instructor: {enrollment.section.instructor?.name || 'TBD'} · Room: {enrollment.section.room?.name || 'TBD'}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        {enrollment.section.meetings.length > 0
                          ? enrollment.section.meetings.map(meeting => `${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`).join(' • ')
                          : 'Meeting time TBA'}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0 text-xs text-gray-500">
                      Enrolled on {new Date(enrollment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Two-column bottom section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Classes</h3>
              {nextCourses.length === 0 ? (
                <p className="text-sm text-gray-600">No upcoming classes scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {nextCourses.map(enrollment => (
                    <div key={enrollment.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        {enrollment.section.course.code} - {enrollment.section.course.name}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {enrollment.section.meetings.length > 0
                          ? `${enrollment.section.meetings[0].dayOfWeek} ${enrollment.section.meetings[0].startTime}-${enrollment.section.meetings[0].endTime}`
                          : 'Time TBA'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Schedule</h3>
                  <p className="text-sm text-gray-500">Live view of your weekly timetable with newly assigned sections.</p>
                </div>
                <Link href="/student/schedule" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                  Open full schedule
                </Link>
              </div>
              {loading ? (
                <p className="text-sm text-gray-500">Loading schedule...</p>
              ) : enrollments.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No enrolled courses yet. You’ll see your schedule here once assigned.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs md:text-sm border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border bg-gray-50">Time</th>
                        {days.map(day => (
                          <th key={day} className="px-4 py-2 border bg-gray-50">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map(slot => (
                        <tr key={slot}>
                          <td className="px-4 py-2 border font-semibold text-gray-600">{slot}</td>
                          {days.map(day => {
                            const cell = getScheduleForDayAndTime(day, slot)
                            return (
                              <td key={`${day}-${slot}`} className="px-3 py-2 border align-top">
                                {cell ? (
                                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-blue-900">
                                    <p className="font-semibold text-xs md:text-sm">{cell.course}</p>
                                    <p className="text-[10px] md:text-xs">{cell.room}</p>
                                    <p className="text-[10px] md:text-xs text-blue-700">{cell.instructor}</p>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-gray-400">Free</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
