'use client'
import { useDialog } from '../hooks/useDialog'

interface Conflict {
  type: string
  message: string
  conflictingCourse: string
  conflictingCourseName: string
  day: string
  time: string
  currentCourse: string
  currentCourseName: string
}

interface ConflictsModalProps {
  isOpen: boolean
  onClose: () => void
  conflicts: Conflict[]
  onChooseAnotherTime: () => void
}

export function ConflictsModal({ isOpen, onClose, conflicts, onChooseAnotherTime }: ConflictsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Schedule Conflicts Detected
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              The following conflicts were found. Please choose another time slot to resolve these conflicts.
            </p>
            
            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-red-800">
                        {conflict.type === 'student_time_conflict' ? 'Student Time Conflict' : 'Faculty Time Conflict'}
                      </h4>
                      <div className="mt-2 text-sm text-red-700">
                        <p className="font-medium">
                          Trying to add: {conflict.currentCourse} - {conflict.currentCourseName}
                        </p>
                        <p className="mt-1">
                          Conflicts with: {conflict.conflictingCourse} - {conflict.conflictingCourseName}
                        </p>
                        <p className="mt-1">
                          <span className="font-medium">Day:</span> {conflict.day} | 
                          <span className="font-medium ml-2">Time:</span> {conflict.time}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onChooseAnotherTime}
              className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Choose Another Time
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
