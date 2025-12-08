'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { AppHeader } from '../../../components/AppHeader'
import { useAuth } from '../../../components/AuthProvider'

interface Grade {
  id: string
  numericGrade: number | null
  letterGrade: string
  points: number | null
  semester: number
  academicYear?: string | null
  course: {
    id: string
    code: string
    name: string
    credits: number
  }
  isPN?: boolean // Pending/Not entered
}

interface GPAData {
  cumulative: number
  totalCredits: number
  totalPoints: number
}

export default function StudentGradesPage() {
  const { getCurrentUser } = useAuth()
  const user = getCurrentUser()
  const [grades, setGrades] = useState<Grade[]>([])
  const [gpa, setGpa] = useState<GPAData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSemester, setSelectedSemester] = useState<number | string>('')
  const [availableSemesters, setAvailableSemesters] = useState<Array<{ value: string; label: string }>>([])

  useEffect(() => {
    if (user?.id) {
      loadGrades()
      loadAvailableSemesters()
    }
  }, [user?.id])

  const loadAvailableSemesters = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      // Get all grades first to extract unique semesters
      const gradesRes = await fetch(`${API_BASE_URL}/grades/student/${user?.id}`, {
        credentials: 'include'
      })
      
      const semestersSet = new Set<string>()
      
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json()
        if (gradesData.success && gradesData.data?.grades) {
          // Extract unique semesters from grades
          gradesData.data.grades.forEach((grade: Grade) => {
            if (grade.academicYear && grade.semester) {
              const key = `${grade.academicYear}-${grade.semester}`
              semestersSet.add(key)
            }
          })
        }
      }
      
      // Convert to array and sort
      const semesters = Array.from(semestersSet)
        .map(key => {
          const [academicYear, semesterNum] = key.split('-')
          return {
            value: key,
            label: `${academicYear} Semester ${semesterNum}`
          }
        })
        .sort((a, b) => {
          const [aYear, aNum] = a.value.split('-')
          const [bYear, bNum] = b.value.split('-')
          if (aYear !== bYear) {
            return bYear.localeCompare(aYear)
          }
          return parseInt(bNum) - parseInt(aNum)
        })
      
      setAvailableSemesters(semesters)
      // Set default to first semester if available
      if (semesters.length > 0 && !selectedSemester) {
        setSelectedSemester(semesters[0].value)
      }
    } catch (error) {
      console.error('Error loading available semesters:', error)
    }
  }

  const loadGrades = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      // Load grades - show all grades from closed semesters
      try {
        const gradesRes = await fetch(`${API_BASE_URL}/grades/student/${user?.id}`, {
          credentials: 'include'
        })
        
        if (gradesRes.ok) {
          const data = await gradesRes.json()
          if (data.success) {
            const allGrades = data.data.grades || []
            // Filter to only show grades from closed semesters (or PN grades)
            // PN grades are already from closed semesters
            setGrades(allGrades)
            setGpa(data.data.gpa || null)
          } else {
            setGrades([])
            setGpa(null)
          }
        } else {
          setGrades([])
          setGpa(null)
        }
      } catch (gradesError) {
        console.error('Error loading grades:', gradesError)
        setGrades([])
        setGpa(null)
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      setGrades([])
      setGpa(null)
    } finally {
      setLoading(false)
    }
  }

  const filteredGrades = selectedSemester
    ? grades.filter(g => {
        // If selectedSemester is a string like "2025/2026-1", parse it
        const [year, sem] = selectedSemester.toString().split('-')
        return g.academicYear === year && g.semester === Number(sem)
      })
    : grades

  const semesterGPA = selectedSemester !== 'all' && filteredGrades.length > 0
    ? (() => {
        const gradesWithPoints = filteredGrades.filter(g => !g.isPN && g.points !== null)
        if (gradesWithPoints.length === 0) return null
        const totalPoints = gradesWithPoints.reduce((sum, g) => sum + ((g.points || 0) * g.course.credits), 0)
        const totalCredits = gradesWithPoints.reduce((sum, g) => sum + g.course.credits, 0)
        return totalCredits > 0 ? totalPoints / totalCredits : null
      })()
    : null

  const getGradeColor = (letter: string) => {
    if (letter === 'A+' || letter === 'A') return 'bg-green-100 text-green-800'
    if (letter.startsWith('B')) return 'bg-blue-100 text-blue-800'
    if (letter.startsWith('C')) return 'bg-yellow-100 text-yellow-800'
    if (letter.startsWith('D')) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="My Grades" showBack={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Result</h1>
              <p className="mt-2 text-gray-600">View your course grades by semester</p>
            </div>
            <a
              href="/student/transcript"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              View Transcript
            </a>
          </div>

          {/* GPA Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Cumulative GPA</h2>
              <p className="text-4xl font-bold text-blue-600">
                {gpa ? gpa.cumulative.toFixed(2) : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {gpa ? `${gpa.totalCredits} credits completed` : 'No grades yet'}
              </p>
            </div>
            {selectedSemester && semesterGPA !== null && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-sm font-medium text-gray-500 mb-2">
                  {availableSemesters.find(opt => opt.value === selectedSemester)?.label || 'Semester GPA'}
                </h2>
                <p className="text-4xl font-bold text-indigo-600">
                  {semesterGPA.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {filteredGrades.reduce((sum, g) => sum + g.course.credits, 0)} credits
                </p>
              </div>
            )}
          </div>

          {/* Semester Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full md:w-64 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a semester...</option>
              {availableSemesters.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Grades Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading grades...</div>
            ) : filteredGrades.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {selectedSemester
                  ? `No grades for ${availableSemesters.find(opt => opt.value === selectedSemester)?.label || 'this semester'}`
                  : 'Please select a semester to view grades'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numeric Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Letter Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Semester
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredGrades.map(grade => (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{grade.course?.code || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{grade.course?.name || 'Unknown Course'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grade.course?.credits || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.isPN ? '—' : grade.numericGrade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            grade.isPN 
                              ? 'bg-gray-200 text-gray-700 border border-gray-300' 
                              : getGradeColor(grade.letterGrade)
                          }`}>
                            {grade.letterGrade}
                            {grade.isPN && <span className="ml-1 text-xs">(Not entered)</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.isPN ? '—' : grade.points?.toFixed(1) || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.academicYear 
                            ? `${grade.academicYear} Semester ${grade.semester}`
                            : `Semester ${grade.semester}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

