'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function FacultyAvailability() {
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [showToast, setShowToast] = useState(false)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00', 
    '14:00-16:00', '16:00-18:00'
  ]

  const toggleAvailability = (day: string, time: string) => {
    const key = `${day}-${time}`
    setAvailability(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const getAvailabilityKey = (day: string, time: string) => `${day}-${time}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/faculty/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Available Time Slots</h3>
              <p className="text-sm text-gray-600 mb-6">Click on time slots to mark them as available for teaching.</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      {days.map(day => (
                        <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {timeSlots.map(time => (
                      <tr key={time}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {time}
                        </td>
                        {days.map(day => {
                          const key = getAvailabilityKey(day, time)
                          const isAvailable = availability[key] || false
                          return (
                            <td key={`${day}-${time}`} className="px-4 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => toggleAvailability(day, time)}
                                className={`w-8 h-8 rounded-lg border-2 transition-colors ${
                                  isAvailable
                                    ? 'bg-blue-500 border-blue-500 text-white'
                                    : 'bg-white border-gray-300 text-gray-400 hover:border-blue-300'
                                }`}
                              >
                                {isAvailable && (
                                  <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Availability Summary</h4>
              <p className="text-sm text-blue-700">
                You have selected {Object.values(availability).filter(Boolean).length} available time slots.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Availability
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Availability saved successfully!
        </div>
      )}
    </div>
  )
}
