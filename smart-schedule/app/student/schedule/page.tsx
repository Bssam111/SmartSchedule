'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ScheduleItem {
  id: string
  course: {
    code: string
    name: string
  }
  section: string
  time: string
  room: string
  instructor: {
    name: string
  }
  timeSlot: {
    day: string
    startTime: string
    endTime: string
  }
}

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId] = useState('cmg5jf2h900049gj9gvuvc0zs') // This would come from authentication in a real app

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/faculty/assignments?facultyId=${studentId}`)
      const result = await response.json()

      if (result.success) {
        setSchedule(result.data)
      } else {
        console.error('Error loading schedule:', result.error)
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const timeSlots = ['08:00-08:50', '09:00-09:50', '10:00-10:50', '11:00-11:50', '13:00-13:50', '14:00-14:50', '15:00-15:50', '16:00-16:50', '17:00-17:50', '18:00-18:50', '19:00-19:50']

  const getScheduleForDayAndTime = (day: string, time: string) => {
    return schedule.find(s => s.timeSlot.day === day && s.time === time)
  }

  const exportSchedule = () => {
    const csvContent = "Day,Time,Course,Room,Instructor\n" + 
      schedule.map(s => `${s.timeSlot.day},${s.time},${s.course.code},${s.room},${s.instructor.name}`).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'my-schedule.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/student/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            </div>
            <button
              onClick={exportSchedule}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedule...</p>
            </div>
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
                                <div className="text-sm font-medium text-blue-900">{scheduleItem.course.code}</div>
                                <div className="text-xs text-blue-700">{scheduleItem.room}</div>
                                <div className="text-xs text-blue-600">{scheduleItem.instructor.name}</div>
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
            <p className="text-3xl font-bold text-blue-600">{new Set(schedule.map(s => s.course.code)).size}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Hours</h3>
            <p className="text-3xl font-bold text-green-600">{schedule.length * 2}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Draft
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
