'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { AppHeader } from '../../../components/AppHeader'
import { useToast, showToast } from '../../../components/Toast'

interface Semester {
  id: string
  academicYear: string
  semesterNumber: number
  name: string
  isCurrent: boolean
  startDate?: string
  endDate?: string
  registrationWindows?: RegistrationWindow[]
}

interface RegistrationWindow {
  id: string
  startDate: string
  endDate: string
  isOpen: boolean
  allowAddDrop: boolean
  maxRoomCapacity: number
  maxStudentCapacity: number
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('')
  const [showWindowForm, setShowWindowForm] = useState(false)
  const [showCreateSemester, setShowCreateSemester] = useState(false)
  const [newSemester, setNewSemester] = useState({
    academicYear: '',
    semesterNumber: 1,
    startDate: '',
    endDate: ''
  })
  const [windowForm, setWindowForm] = useState({
    startDate: '',
    endDate: '',
    allowAddDrop: true,
    maxRoomCapacity: 40,
    maxStudentCapacity: 30
  })
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    loadSemesters()
  }, [])

  const loadSemesters = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const [semestersRes, currentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/semesters`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/semesters/current`, { credentials: 'include' })
      ])

      if (semestersRes.ok) {
        const data = await semestersRes.json()
        if (data.success) {
          setSemesters(data.data || [])
        }
      }

      if (currentRes.ok) {
        const data = await currentRes.json()
        if (data.success && data.data) {
          setCurrentSemester(data.data)
          setSelectedSemesterId(data.data.id)
        }
      }
    } catch (error) {
      console.error('Error loading semesters:', error)
      showToast('Failed to load semesters', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSetCurrent = async () => {
    if (!selectedSemesterId) {
      showToast('Please select a semester first', 'warning')
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/semesters/set-current`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ semesterId: selectedSemesterId })
      })

      if (response.ok) {
        const data = await response.json()
        showToast(data.message || 'Current semester updated', 'success')
        loadSemesters()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to set current semester', 'error')
      }
    } catch (error) {
      showToast('Failed to set current semester', 'error')
    }
  }

  const handleCreateSemester = async () => {
    // Validate academic year format (YYYY/YYYY)
    if (!/^\d{4}\/\d{4}$/.test(newSemester.academicYear)) {
      showToast('Academic year must be in format YYYY/YYYY (e.g., 2025/2026)', 'error')
      return
    }

    try {
      // Convert datetime-local format to ISO 8601 format
      const convertToISO = (datetimeLocal: string): string | undefined => {
        if (!datetimeLocal) return undefined
        // datetime-local format: "2025-01-15T10:30"
        // ISO 8601 format: "2025-01-15T10:30:00.000Z"
        return new Date(datetimeLocal).toISOString()
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/semesters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          academicYear: newSemester.academicYear,
          semesterNumber: newSemester.semesterNumber,
          startDate: convertToISO(newSemester.startDate),
          endDate: convertToISO(newSemester.endDate)
        })
      })

      if (response.ok) {
        showToast('Semester created successfully', 'success')
        setShowCreateSemester(false)
        setNewSemester({
          academicYear: '',
          semesterNumber: 1,
          startDate: '',
          endDate: ''
        })
        loadSemesters()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to create semester', 'error')
      }
    } catch (error) {
      showToast('Failed to create semester', 'error')
    }
  }

  const handleCreateWindow = async () => {
    try {
      const semester = semesters.find(s => s.id === selectedSemesterId)
      if (!semester) {
        showToast('Please select a semester first', 'warning')
        return
      }

      // Convert datetime-local format to ISO 8601 format
      const convertToISO = (datetimeLocal: string): string => {
        if (!datetimeLocal) throw new Error('Date is required')
        return new Date(datetimeLocal).toISOString()
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/semesters/registration-windows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          semesterId: semester.id,
          startDate: convertToISO(windowForm.startDate),
          endDate: convertToISO(windowForm.endDate),
          allowAddDrop: windowForm.allowAddDrop,
          maxRoomCapacity: windowForm.maxRoomCapacity,
          maxStudentCapacity: windowForm.maxStudentCapacity
        })
      })

      if (response.ok) {
        showToast('Registration window created', 'success')
        setShowWindowForm(false)
        setWindowForm({
          startDate: '',
          endDate: '',
          allowAddDrop: true,
          maxRoomCapacity: 40,
          maxStudentCapacity: 30
        })
        loadSemesters()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to create window', 'error')
      }
    } catch (error) {
      showToast('Failed to create registration window', 'error')
    }
  }

  const handleToggleWindow = async (windowId: string, isOpen: boolean) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/semesters/registration-windows/${windowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isOpen: !isOpen })
      })

      if (response.ok) {
        showToast(`Registration window ${!isOpen ? 'opened' : 'closed'}`, 'success')
        loadSemesters()
      } else {
        showToast('Failed to update window', 'error')
      }
    } catch (error) {
      showToast('Failed to update registration window', 'error')
    }
  }

  const handleCloseSemester = async (semesterId: string) => {
    if (!confirm('Are you sure you want to close this semester? This will calculate all grades and update student progress. This action cannot be undone.')) {
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/semesters/${semesterId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        showToast(
          `Semester closed successfully. Processed: ${data.data.processed}, Passed: ${data.data.passed}, Failed: ${data.data.failed}, Pending (PN): ${data.data.pending}`,
          'success'
        )
        loadSemesters()
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to close semester', 'error')
      }
    } catch (error) {
      showToast('Failed to close semester', 'error')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Semester Management" showBack={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Semester Management</h1>
            <p className="mt-2 text-gray-600">Manage current semester and registration windows</p>
          </div>

          {/* Create Semester */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Semesters</h2>
              <button
                onClick={() => setShowCreateSemester(!showCreateSemester)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {showCreateSemester ? 'Cancel' : '+ Create Semester'}
              </button>
            </div>

            {showCreateSemester && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Create New Semester</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year (YYYY/YYYY)</label>
                    <input
                      type="text"
                      placeholder="2025/2026"
                      value={newSemester.academicYear}
                      onChange={(e) => setNewSemester({ ...newSemester, academicYear: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester Number</label>
                    <select
                      value={newSemester.semesterNumber}
                      onChange={(e) => setNewSemester({ ...newSemester, semesterNumber: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={newSemester.startDate}
                      onChange={(e) => setNewSemester({ ...newSemester, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={newSemester.endDate}
                      onChange={(e) => setNewSemester({ ...newSemester, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateSemester}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Semester
                </button>
              </div>
            )}

            {/* Current Semester */}
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Current Semester</h3>
              {currentSemester ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-xl font-bold text-blue-600">{currentSemester.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {currentSemester.academicYear} - Semester {currentSemester.semesterNumber}
                    </p>
                    {currentSemester.startDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(currentSemester.startDate).toLocaleDateString()} -{' '}
                        {currentSemester.endDate ? new Date(currentSemester.endDate).toLocaleDateString() : 'TBD'}
                      </p>
                    )}
                    {currentSemester.endDate && new Date(currentSemester.endDate) < new Date() && (
                      <p className="text-xs text-red-600 mt-1 font-semibold">Semester Closed</p>
                    )}
                  </div>
                  {currentSemester.endDate && new Date(currentSemester.endDate) >= new Date() && (
                    <button
                      onClick={() => handleCloseSemester(currentSemester.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      Close Semester
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No current semester set</p>
              )}
            </div>

            {/* Select Semester to Set as Current */}
            <div className="flex items-center gap-4">
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a semester...</option>
                {semesters.map(sem => (
                  <option key={sem.id} value={sem.id}>
                    {sem.name} {sem.isCurrent && '(Current)'}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSetCurrent}
                disabled={!selectedSemesterId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Set as Current
              </button>
            </div>
          </div>

          {/* Registration Windows */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Registration Windows</h2>
              <button
                onClick={() => setShowWindowForm(!showWindowForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {showWindowForm ? 'Cancel' : '+ Create Window'}
              </button>
            </div>

            {showWindowForm && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Create Registration Window</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="datetime-local"
                      value={windowForm.startDate}
                      onChange={(e) => setWindowForm({ ...windowForm, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="datetime-local"
                      value={windowForm.endDate}
                      onChange={(e) => setWindowForm({ ...windowForm, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Room Capacity</label>
                    <input
                      type="number"
                      value={windowForm.maxRoomCapacity}
                      onChange={(e) => setWindowForm({ ...windowForm, maxRoomCapacity: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Student Capacity</label>
                    <input
                      type="number"
                      value={windowForm.maxStudentCapacity}
                      onChange={(e) => setWindowForm({ ...windowForm, maxStudentCapacity: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allowAddDrop"
                      checked={windowForm.allowAddDrop}
                      onChange={(e) => setWindowForm({ ...windowForm, allowAddDrop: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="allowAddDrop" className="text-sm text-gray-700">Allow Add/Drop</label>
                  </div>
                </div>
                <button
                  onClick={handleCreateWindow}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Window
                </button>
              </div>
            )}

            <div className="space-y-4">
              {semesters
                .filter(s => s.registrationWindows && s.registrationWindows.length > 0)
                .map(semester => (
                  <div key={semester.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{semester.name}</h3>
                    </div>
                    {semester.registrationWindows?.map(window => (
                      <div key={window.id} className="bg-gray-50 rounded-lg p-4 mt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              {new Date(window.startDate).toLocaleString()} - {new Date(window.endDate).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Room Capacity: {window.maxRoomCapacity} | Student Capacity: {window.maxStudentCapacity}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium mb-1 ${
                                window.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                Status: {window.isOpen ? 'Open' : 'Closed'}
                              </span>
                              <button
                                onClick={() => handleToggleWindow(window.id, window.isOpen)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                                  window.isOpen
                                    ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                                    : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                                }`}
                              >
                                {window.isOpen ? '🔒 Close Window' : '🔓 Open Window'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

