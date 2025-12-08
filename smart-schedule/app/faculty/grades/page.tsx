'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { AppHeader } from '../../../components/AppHeader'
import { useToast, showToast } from '../../../components/Toast'
import { useAuth } from '../../../components/AuthProvider'

interface Assignment {
  id: string
  studentId: string
  courseId: string
  student: {
    id: string
    name: string
    universityId: string
    email: string
  }
  course: {
    id: string
    code: string
    name: string
    credits: number
  }
  section?: {
    id: string
    name: string
  }
  grade?: {
    id: string
    numericGrade: number
    letterGrade: string
    points: number
    semester?: number
    academicYear?: string | null
  }
}

interface Section {
  id: string
  name: string
  course: {
    id: string
    code: string
    name: string
  } | null
}

interface SemesterGroup {
  semesterKey: string
  semesterName: string
  sections: Array<{
    sectionId: string
    sectionName: string
    course: { id: string; code: string; name: string } | null
    assignments: Assignment[]
  }>
}

export default function FacultyGradesPage() {
  const { getCurrentUser } = useAuth()
  const user = getCurrentUser()
  const [sections, setSections] = useState<Section[]>([])
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([])
  const [groupedData, setGroupedData] = useState<SemesterGroup[]>([])
  const [currentSemester, setCurrentSemester] = useState<{ academicYear: string; semesterNumber: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({})
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    if (user?.id) {
      loadAllData()
    }
  }, [user?.id])

  useEffect(() => {
    if (sections.length > 0 && (allAssignments.length > 0 || currentSemester)) {
      const grouped = groupAssignmentsBySemesterAndSection()
      setGroupedData(grouped)
    }
  }, [sections, allAssignments, currentSemester])

  const loadAllData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      
      // Load current semester
      let currentSem: { academicYear: string; semesterNumber: number } | null = null
      try {
        const semesterResponse = await fetch(`${API_BASE_URL}/semesters/current`, {
          credentials: 'include'
        })
        if (semesterResponse.ok) {
          const semesterData = await semesterResponse.json()
          if (semesterData.success && semesterData.data) {
            currentSem = {
              academicYear: semesterData.data.academicYear,
              semesterNumber: semesterData.data.semesterNumber
            }
            setCurrentSemester(currentSem)
          }
        } else {
          console.error('Failed to fetch current semester:', semesterResponse.status, semesterResponse.statusText)
        }
      } catch (error) {
        console.error('Error fetching current semester:', error)
      }

      // Load all sections
      const sectionsResponse = await fetch(`${API_BASE_URL}/sections?instructorId=${user.id}`, {
        credentials: 'include'
      })

      if (!sectionsResponse.ok) {
        throw new Error(`Failed to fetch sections: ${sectionsResponse.status} ${sectionsResponse.statusText}`)
      }

      const sectionsData = await sectionsResponse.json()
      if (sectionsData.success) {
        const sectionsList = sectionsData.data || []
        setSections(sectionsList)
          
          // Load assignments for all sections
          const assignmentsPromises = sectionsList.map(async (section: Section) => {
            try {
              const res = await fetch(`${API_BASE_URL}/grades/section/${section.id}`, {
                credentials: 'include'
              })
              
              if (!res.ok) {
                console.error(`Failed to fetch assignments for section ${section.id}:`, res.status, res.statusText)
                return { sectionId: section.id, sectionName: section.name, result: { success: false, data: [] } }
              }
              
              const result = await res.json()
              return { sectionId: section.id, sectionName: section.name, result }
            } catch (error) {
              console.error(`Error fetching assignments for section ${section.id}:`, error)
              return { sectionId: section.id, sectionName: section.name, result: { success: false, data: [], error: error instanceof Error ? error.message : 'Unknown error' } }
            }
          })

          const assignmentsResults = await Promise.all(assignmentsPromises)
          const allAssignmentsData: Assignment[] = []
          const inputs: Record<string, string> = {}

          assignmentsResults.forEach(({ sectionId, sectionName, result }: any) => {
            if (result.success && result.data) {
              result.data.forEach((assignment: any) => {
                // Add section information to each assignment
                const assignmentWithSection: Assignment = {
                  ...assignment,
                  section: {
                    id: sectionId,
                    name: sectionName
                  }
                }
                allAssignmentsData.push(assignmentWithSection)
                if (assignment.grade) {
                  inputs[assignment.id] = assignment.grade.numericGrade.toString()
                }
              })
            }
          })

          setAllAssignments(allAssignmentsData)
          setGradeInputs(inputs)
          
          // Group the data immediately
          const grouped = groupAssignmentsBySemesterAndSection(allAssignmentsData, sectionsList, currentSem)
          setGroupedData(grouped)
        }
    } catch (error) {
      console.error('Error loading data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const groupAssignmentsBySemesterAndSection = (assignments: Assignment[] = allAssignments, sectionsList: Section[] = sections, semester: typeof currentSemester = currentSemester): SemesterGroup[] => {
    const grouped: Record<string, SemesterGroup['sections']> = {}

    // Group assignments by semester and section
    // First, group all assignments by their section
    const assignmentsBySection = new Map<string, Assignment[]>()
    
    assignments.forEach(assignment => {
      const sectionId = assignment.section?.id
      if (sectionId) {
        if (!assignmentsBySection.has(sectionId)) {
          assignmentsBySection.set(sectionId, [])
        }
        assignmentsBySection.get(sectionId)!.push(assignment)
      } else {
        console.warn('Assignment missing section info:', assignment)
      }
    })

    // Process each section
    sectionsList.forEach(section => {
      const sectionAssignments = assignmentsBySection.get(section.id) || []
      
      if (sectionAssignments.length === 0) {
        // Section with no assignments - use current semester
        if (semester) {
          const semesterKey = `${semester.academicYear}-${semester.semesterNumber}`
          if (!grouped[semesterKey]) {
            grouped[semesterKey] = []
          }
          grouped[semesterKey].push({
            sectionId: section.id,
            sectionName: section.name,
            course: section.course,
            assignments: []
          })
        }
        return
      }

      // Group by semester from grade, or use current semester
      sectionAssignments.forEach(assignment => {
        const semesterKey = assignment.grade?.academicYear && assignment.grade?.semester
          ? `${assignment.grade.academicYear}-${assignment.grade.semester}`
          : semester
            ? `${semester.academicYear}-${semester.semesterNumber}`
            : 'unknown'

        if (!grouped[semesterKey]) {
          grouped[semesterKey] = []
        }

        let sectionGroup = grouped[semesterKey].find(s => s.sectionId === section.id)
        if (!sectionGroup) {
          sectionGroup = {
            sectionId: section.id,
            sectionName: section.name,
            course: section.course,
            assignments: []
          }
          grouped[semesterKey].push(sectionGroup)
        }

        sectionGroup.assignments.push(assignment)
      })
    })

    // Convert to array and sort
    const groupedArray: SemesterGroup[] = Object.entries(grouped).map(([semesterKey, sections]) => {
      const [academicYear, semesterNumber] = semesterKey.split('-')
      const semesterName = academicYear && semesterNumber
        ? `${academicYear} Semester ${semesterNumber}`
        : 'Unknown Semester'

      return {
        semesterKey,
        semesterName,
        sections: sections.sort((a, b) => (a.course?.code || '').localeCompare(b.course?.code || ''))
      }
    }).sort((a, b) => {
      // Sort by academic year (descending) then semester number (descending)
      const [aYear, aSem] = a.semesterKey.split('-')
      const [bYear, bSem] = b.semesterKey.split('-')
      if (aYear !== bYear) {
        return bYear.localeCompare(aYear)
      }
      return parseInt(bSem) - parseInt(aSem)
    })

    return groupedArray
  }

  const getLetterGrade = (numeric: number): { letter: string; points: number } => {
    if (numeric >= 95) return { letter: 'A+', points: 5.0 }
    if (numeric >= 90) return { letter: 'A', points: 4.75 }
    if (numeric >= 85) return { letter: 'B+', points: 4.5 }
    if (numeric >= 80) return { letter: 'B', points: 4.0 }
    if (numeric >= 75) return { letter: 'C+', points: 3.5 }
    if (numeric >= 70) return { letter: 'C', points: 3.0 }
    if (numeric >= 65) return { letter: 'D+', points: 2.5 }
    if (numeric >= 60) return { letter: 'D', points: 2.0 }
    return { letter: 'F', points: 0.0 }
  }

  const handleGradeChange = (assignmentId: string, value: string) => {
    setGradeInputs({ ...gradeInputs, [assignmentId]: value })
  }

  const handleSaveGrade = async (assignment: Assignment) => {
    const numericValue = gradeInputs[assignment.id]
    if (!numericValue) {
      showToast('Please enter a grade', 'warning')
      return
    }

    const numeric = parseInt(numericValue, 10)
    if (isNaN(numeric) || numeric < 0 || numeric > 100) {
      showToast('Grade must be between 0 and 100', 'error')
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      // Use semester from grade if exists, otherwise use current semester
      const semesterNumber = assignment.grade?.semester || currentSemester?.semesterNumber || 1
      const academicYear = assignment.grade?.academicYear || currentSemester?.academicYear || null
      
      const response = await fetch(`${API_BASE_URL}/grades/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assignmentId: assignment.id,
          numericGrade: numeric,
          semester: semesterNumber,
          academicYear: academicYear
        })
      })

      if (response.ok) {
        showToast(`Grade saved for ${assignment.student.name}`, 'success')
        loadAllData() // Reload all data to refresh grouping
      } else {
        const data = await response.json()
        showToast(data.error || 'Failed to save grade', 'error')
      }
    } catch (error) {
      showToast('Failed to save grade', 'error')
    }
  }

  return (
    <ProtectedRoute requiredRole={['faculty', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Grade Entry" showBack={true} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Grade Entry</h1>
            <p className="mt-2 text-gray-600">Enter and manage student grades</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading students...</div>
          ) : groupedData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No sections found</div>
          ) : (
            <div className="space-y-8">
              {groupedData.map((semesterGroup) => (
                <div key={semesterGroup.semesterKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {/* Semester Header */}
                  <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{semesterGroup.semesterName}</h2>
                  </div>

                  {/* Sections within this semester */}
                  <div className="divide-y divide-gray-200">
                    {semesterGroup.sections.map((sectionGroup) => (
                      <div key={sectionGroup.sectionId} className="p-6">
                        {/* Section Header */}
                        <div className="mb-4 pb-3 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {sectionGroup.course ? `${sectionGroup.course.code} - ${sectionGroup.course.name}` : 'Unknown Course'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Section: {sectionGroup.sectionName} • {sectionGroup.assignments.length} student(s)
                          </p>
                        </div>

                        {/* Students Table */}
                        {sectionGroup.assignments.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            No students enrolled in this section
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    University ID
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
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sectionGroup.assignments.map(assignment => {
                                  const numericValue = gradeInputs[assignment.id] || ''
                                  const numeric = numericValue ? parseInt(numericValue, 10) : null
                                  const gradeInfo = numeric !== null && !isNaN(numeric) ? getLetterGrade(numeric) : null
                                  return (
                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{assignment.student.name}</div>
                                        <div className="text-sm text-gray-500">{assignment.student.email}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {assignment.student.universityId}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={numericValue}
                                          onChange={(e) => handleGradeChange(assignment.id, e.target.value)}
                                          placeholder={assignment.grade?.numericGrade.toString() || '0-100'}
                                          className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-900 bg-white"
                                        />
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {gradeInfo ? (
                                          <span className={`px-2 py-1 rounded ${
                                            gradeInfo.letter === 'A+' || gradeInfo.letter === 'A' ? 'bg-green-100 text-green-800' :
                                            gradeInfo.letter.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                            gradeInfo.letter.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                                            gradeInfo.letter.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {gradeInfo.letter}
                                          </span>
                                        ) : assignment.grade ? (
                                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800">
                                            {assignment.grade.letterGrade}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {gradeInfo ? gradeInfo.points.toFixed(1) : assignment.grade?.points?.toFixed(1) || '-'}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                          onClick={() => handleSaveGrade(assignment)}
                                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                          Save
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

