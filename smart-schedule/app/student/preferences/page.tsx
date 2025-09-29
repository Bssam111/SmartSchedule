'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function StudentPreferences() {
  const [preferences, setPreferences] = useState({
    electives: ['CS301', 'ART110'],
    priorities: ['CS301', 'ART110'],
    notes: 'Prefer morning classes'
  })
  const [showToast, setShowToast] = useState(false)

  const availableElectives = [
    { id: 'CS301', name: 'Advanced Programming', credits: 3 },
    { id: 'ART110', name: 'Introduction to Art', credits: 2 },
    { id: 'MATH201', name: 'Calculus II', credits: 4 },
    { id: 'PHYS102', name: 'Physics II', credits: 3 }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
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
              <h1 className="text-2xl font-bold text-gray-900">Course Preferences</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Elective Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Elective Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableElectives.map(elective => (
                  <label key={elective.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.electives.includes(elective.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPreferences(prev => ({
                            ...prev,
                            electives: [...prev.electives, elective.id]
                          }))
                        } else {
                          setPreferences(prev => ({
                            ...prev,
                            electives: prev.electives.filter(id => id !== elective.id)
                          }))
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{elective.name}</div>
                      <div className="text-sm text-gray-500">{elective.id} • {elective.credits} credits</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Order */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Order</h3>
              <div className="space-y-3">
                {preferences.electives.map((electiveId, index) => {
                  const elective = availableElectives.find(e => e.id === electiveId)
                  return (
                    <div key={electiveId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 w-8">{index + 1}.</span>
                      <span className="flex-1 text-sm text-gray-900">{elective?.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newPriorities = [...preferences.priorities]
                          const currentIndex = newPriorities.indexOf(electiveId)
                          if (currentIndex > 0) {
                            [newPriorities[currentIndex], newPriorities[currentIndex - 1]] = 
                            [newPriorities[currentIndex - 1], newPriorities[currentIndex]]
                            setPreferences(prev => ({ ...prev, priorities: newPriorities }))
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newPriorities = [...preferences.priorities]
                          const currentIndex = newPriorities.indexOf(electiveId)
                          if (currentIndex < newPriorities.length - 1) {
                            [newPriorities[currentIndex], newPriorities[currentIndex + 1]] = 
                            [newPriorities[currentIndex + 1], newPriorities[currentIndex]]
                            setPreferences(prev => ({ ...prev, priorities: newPriorities }))
                          }
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={index === preferences.priorities.length - 1}
                      >
                        ↓
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-4">Additional Notes</label>
              <textarea
                value={preferences.notes}
                onChange={(e) => setPreferences(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special requirements or preferences..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Preferences saved successfully!
        </div>
      )}
    </div>
  )
}
