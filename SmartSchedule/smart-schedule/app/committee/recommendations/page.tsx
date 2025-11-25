'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function CommitteeRecommendations() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [showToast, setShowToast] = useState(false)

  const generateRecommendations = async () => {
    setIsGenerating(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockRecommendations = [
      {
        id: 1,
        course: 'CS201',
        section: '001',
        instructor: 'Dr. Smith',
        time: 'Mon/Wed 08:00-10:00',
        room: 'Room A',
        rationale: 'Optimal time slot with high student availability',
        confidence: 95
      },
      {
        id: 2,
        course: 'MATH101',
        section: '001',
        instructor: 'Dr. Johnson',
        time: 'Tue/Thu 10:00-12:00',
        room: 'Room B',
        rationale: 'Balances instructor workload and student preferences',
        confidence: 88
      },
      {
        id: 3,
        course: 'ART110',
        section: '001',
        instructor: 'Dr. Wilson',
        time: 'Wed/Fri 14:00-16:00',
        room: 'Room D',
        rationale: 'Creative course benefits from afternoon scheduling',
        confidence: 92
      }
    ]
    
    setRecommendations(mockRecommendations)
    setIsGenerating(false)
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
              <Link href="/committee/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">AI Recommendations</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Recommended Schedule</h2>
            <p className="text-gray-600 mb-6">
              Use AI to generate an optimal schedule based on current constraints, preferences, and historical data.
            </p>
            <button
              onClick={generateRecommendations}
              disabled={isGenerating}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Generate Recommended Schedule</span>
                </>
              )}
            </button>
          </div>

          {recommendations.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Recommended Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map(rec => (
                  <div key={rec.id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-blue-900">{rec.course} - Section {rec.section}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rec.confidence}% confidence
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Instructor:</span>
                        <span className="text-gray-900">{rec.instructor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="text-gray-900">{rec.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room:</span>
                        <span className="text-gray-900">{rec.room}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-white rounded border">
                      <p className="text-xs text-gray-600 mb-1">Rationale:</p>
                      <p className="text-sm text-gray-800">{rec.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4">
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Accept Recommendations
                </button>
                <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                  Modify & Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Recommendations generated successfully!
        </div>
      )}
    </div>
  )
}
