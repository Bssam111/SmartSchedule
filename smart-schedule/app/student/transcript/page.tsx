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
  isPN?: boolean
}

interface GPAData {
  cumulative: number
  totalCredits: number
  totalPoints: number
}

export default function TranscriptPage() {
  const { getCurrentUser } = useAuth()
  const user = getCurrentUser()
  const [grades, setGrades] = useState<Grade[]>([])
  const [gpa, setGpa] = useState<GPAData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadGrades()
    }
  }, [user?.id])

  const loadGrades = async () => {
    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const response = await fetch(`${API_BASE_URL}/grades/student/${user?.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const allGrades = data.data.grades || []
          setGrades(allGrades)
          setGpa(data.data.gpa || null)
        }
      }
    } catch (error) {
      console.error('Error loading transcript:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group grades by academic year and semester
  // Filter out invalid entries (semester 0 or no academic year for non-PN grades)
  const validGrades = grades.filter(g => {
    // PN grades might have semester 0 initially, but should have been fixed by backend
    // Filter out any grades with invalid semester info
    if (g.semester === 0 && !g.isPN) return false
    if (!g.academicYear && !g.isPN && g.semester === 0) return false
    return true
  })

  const groupedGrades = validGrades.reduce((acc, grade) => {
    // Ensure we have valid semester info
    if (!grade.academicYear || grade.semester === 0) {
      // Skip invalid entries - they should have been fixed by backend
      return acc
    }
    
    const key = `${grade.academicYear}-${grade.semester}`
    if (!acc[key]) {
      acc[key] = {
        academicYear: grade.academicYear,
        semester: grade.semester,
        grades: []
      }
    }
    acc[key].grades.push(grade)
    return acc
  }, {} as Record<string, { academicYear: string; semester: number; grades: Grade[] }>)

  const sortedGroups = Object.values(groupedGrades).sort((a, b) => {
    if (a.academicYear !== b.academicYear) {
      return b.academicYear.localeCompare(a.academicYear)
    }
    return b.semester - a.semester
  })

  const getGradeColor = (letter: string) => {
    if (letter === 'PN') return 'bg-gray-200 text-gray-700 border border-gray-300'
    if (letter === 'A+' || letter === 'A') return 'bg-green-100 text-green-800'
    if (letter.startsWith('B')) return 'bg-blue-100 text-blue-800'
    if (letter.startsWith('C')) return 'bg-yellow-100 text-yellow-800'
    if (letter.startsWith('D')) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Academic Transcript" showBack={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Academic Transcript</h1>
            <p className="mt-2 text-gray-600">Complete academic record across all semesters</p>
          </div>

          {/* GPA Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cumulative GPA</h2>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-sm text-gray-500">GPA</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {gpa ? gpa.cumulative.toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Credits</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {gpa ? gpa.totalCredits : '0'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Semester GPAs</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sortedGroups.length === 0 ? (
                  <p className="text-sm text-gray-500">No semester GPAs available</p>
                ) : (
                  sortedGroups.map((group, idx) => {
                    const semesterGPA = (() => {
                      const gradesWithPoints = group.grades.filter(g => !g.isPN && g.points !== null)
                      if (gradesWithPoints.length === 0) return null
                      const totalPoints = gradesWithPoints.reduce((sum, g) => sum + ((g.points || 0) * g.course.credits), 0)
                      const totalCredits = gradesWithPoints.reduce((sum, g) => sum + g.course.credits, 0)
                      return totalCredits > 0 ? totalPoints / totalCredits : null
                    })()
                    
                    return semesterGPA !== null ? (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{group.academicYear} Sem {group.semester}</span>
                        <span className="font-semibold text-gray-900">{semesterGPA.toFixed(2)}</span>
                      </div>
                    ) : null
                  }).filter(Boolean)
                )}
              </div>
            </div>
          </div>

          {/* Transcript by Semester */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading transcript...</div>
          ) : sortedGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No grades recorded yet</div>
          ) : (
            <div className="space-y-6">
              {sortedGroups.map((group, idx) => {
                const semesterGPA = (() => {
                  const gradesWithPoints = group.grades.filter(g => !g.isPN && g.points !== null)
                  if (gradesWithPoints.length === 0) return null
                  const totalPoints = gradesWithPoints.reduce((sum, g) => sum + ((g.points || 0) * g.course.credits), 0)
                  const totalCredits = gradesWithPoints.reduce((sum, g) => sum + g.course.credits, 0)
                  return totalCredits > 0 ? totalPoints / totalCredits : null
                })()

                return (
                  <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {group.academicYear} - Semester {group.semester}
                        </h3>
                        {semesterGPA !== null && (
                          <p className="text-sm font-medium text-gray-600">
                            Semester GPA: <span className="text-blue-600 font-bold">{semesterGPA.toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                    </div>
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
                              Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Points
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {group.grades.map(grade => (
                            <tr key={grade.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{grade.course?.code || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{grade.course?.name || 'Unknown Course'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {grade.course?.credits || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-sm font-medium ${getGradeColor(grade.letterGrade)}`}>
                                  {grade.letterGrade}
                                  {grade.isPN && <span className="ml-1 text-xs">(Not entered)</span>}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {grade.isPN ? '—' : grade.points?.toFixed(1) || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

