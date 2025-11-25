'use client'
import { useEffect, useMemo, useState } from 'react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'
import { AppHeader } from '../../../components/AppHeader'

interface SectionAssignment {
  id: string
  course: { code: string; name: string }
  room?: { name: string } | null
  meetings: Array<{ id: string; dayOfWeek: string; startTime: string; endTime: string }>
  assignments: Array<{
    id: string
    student: { id: string; name: string; email: string }
  }>
}

const meetingIcon = (
  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const roomIcon = (
  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-6 9 6M4 10h16v10H4z" />
  </svg>
)

const rosterIcon = (
  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A4 4 0 007 19h10a4 4 0 001.879-.496L12 13.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 13.5l-5-3.5A4 4 0 017 3h10a4 4 0 015 7l-5 3.5" />
  </svg>
)

export default function FacultyAssignments() {
  const { getCurrentUser, authState } = useAuth()
  const user = getCurrentUser()
  const facultyId = user?.id
  const [assignments, setAssignments] = useState<SectionAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authState.isLoading && authState.isAuthenticated && facultyId) {
      loadAssignments()
    } else if (!authState.isLoading) {
      setLoading(false)
    }
  }, [facultyId, authState.isLoading, authState.isAuthenticated])

  useEffect(() => {
    const handleSectionCreated = (event: CustomEvent) => {
      const { instructorId } = event.detail
      if (instructorId === facultyId) {
        loadAssignments()
      }
    }

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
    if (!facultyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/faculty/assignments`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && Array.isArray(result.data)) {
        setAssignments(result.data)
      } else {
        setAssignments([])
        setError(result.error || 'No assignments available.')
      }
    } catch (error: any) {
      setAssignments([])
      setError(error.message || 'Unable to load assignments.')
    } finally {
      setLoading(false)
    }
  }

  const summaryStats = useMemo(() => {
    const totalSections = assignments.length
    const totalStudents = assignments.reduce((sum, a) => sum + (a.assignments?.length || 0), 0)
    const rooms = new Set(assignments.map(a => a.room?.name || 'TBD')).size
    return { totalSections, totalStudents, rooms }
  }, [assignments])

  return (
    <ProtectedRoute requiredRole="faculty">
      <div className="min-h-screen bg-slate-50">
        <AppHeader title="My Teaching Assignments" backFallbackUrl="/faculty/dashboard" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500">Assigned Sections</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{summaryStats.totalSections}</p>
              <p className="text-xs text-slate-400 mt-1">Across all schedules</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500">Total Students</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{summaryStats.totalStudents}</p>
              <p className="text-xs text-slate-400 mt-1">Enrolled across sections</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500">Rooms Utilized</p>
              <p className="mt-2 text-3xl font-bold text-indigo-600">{summaryStats.rooms}</p>
              <p className="text-xs text-slate-400 mt-1">Unique teaching spaces</p>
            </div>
          </div>

          {authState.isLoading || loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <p className="text-lg font-semibold text-slate-900">No assignments yet</p>
              <p className="text-sm text-slate-500 mt-1">You will see a section here once the committee assigns you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {assignments.map(section => (
                <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Course</p>
                      <h3 className="text-2xl font-semibold text-slate-900">
                        {section.course?.code} • {section.course?.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2 text-sm text-slate-600">
                      {roomIcon}
                      <span>
                        Room{' '}
                        <strong className="text-slate-900">
                          {section.room?.name || 'TBD'}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                        {meetingIcon}
                        Weekly Meetings
                      </div>
                      <ul className="mt-2 space-y-1 text-indigo-900 text-sm">
                        {section.meetings && section.meetings.length > 0 ? (
                          section.meetings.map(meeting => (
                            <li key={meeting.id}>
                              {meeting.dayOfWeek} · {meeting.startTime}-{meeting.endTime}
                            </li>
                          ))
                        ) : (
                          <li className="text-indigo-500">Schedule TBD</li>
                        )}
                      </ul>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                        {rosterIcon}
                        Student Roster
                      </div>
                      <p className="mt-2 text-sm text-emerald-900">
                        {section.assignments?.length || 0} students enrolled
                      </p>
                      <div className="mt-3 space-y-2 max-h-40 overflow-auto pr-2">
                        {section.assignments && section.assignments.length > 0 ? (
                          section.assignments.map(student => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-slate-900">{student.student.name}</span>
                              <span className="text-xs text-slate-500">{student.student.email}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-emerald-700">No students assigned yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm text-slate-500">Section ID</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {section.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-slate-500 mt-4">Need to adjust availability?</p>
                      <a
                        href="/settings"
                        className="mt-2 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        Update preferences
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>
    </ProtectedRoute>
  )
}
