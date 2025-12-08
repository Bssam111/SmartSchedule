'use client'
import { useState, useEffect } from 'react'

interface Course {
  id: string
  code: string
  name: string
  credits: number
  courseType: 'REQUIRED' | 'UNIVERSITY_ELECTIVE' | 'MATH_ELECTIVE' | 'SCIENCE_ELECTIVE' | 'DEPT_ELECTIVE'
  prerequisites?: Array<{ prerequisiteCourse: { code: string; name: string } }>
  corequisites?: Array<{ corequisiteCourse: { code: string; name: string } }>
  electiveGroup?: { name: string; code: string }
}

interface CourseInPlan {
  id: string
  semester: number
  isRequired: boolean
  displayOrder: number
  course: Course
  progress?: {
    status: 'NOT_TAKEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    semesterTaken?: number
  } | null
}

interface AcademicPlan {
  id: string
  name: string
  major: { name: string; code: string }
  courses: CourseInPlan[]
  studentLevel?: number
}

interface AcademicPlanGridProps {
  plan: AcademicPlan | null
  loading?: boolean
  onCourseClick?: (course: CourseInPlan) => void
}

export function AcademicPlanGrid({ plan, loading, onCourseClick }: AcademicPlanGridProps) {
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No academic plan found. Please contact your advisor.</p>
      </div>
    )
  }

  // Group courses by semester
  const coursesBySemester: Record<number, CourseInPlan[]> = {}
  for (let i = 1; i <= 8; i++) {
    coursesBySemester[i] = []
  }

  plan.courses.forEach(cip => {
    if (cip.semester >= 1 && cip.semester <= 8) {
      coursesBySemester[cip.semester].push(cip)
    }
  })

  // Group electives separately
  const electives = plan.courses.filter(cip => !cip.isRequired)
  const electivesByGroup: Record<string, CourseInPlan[]> = {}
  electives.forEach(cip => {
    const groupCode = cip.course.electiveGroup?.code || 'OTHER'
    if (!electivesByGroup[groupCode]) {
      electivesByGroup[groupCode] = []
    }
    electivesByGroup[groupCode].push(cip)
  })

  const getCourseStatus = (cip: CourseInPlan): 'completed' | 'in-progress' | 'not-taken' | 'failed' => {
    if (!cip.progress) return 'not-taken'
    return cip.progress.status === 'COMPLETED' ? 'completed' :
           cip.progress.status === 'IN_PROGRESS' ? 'in-progress' :
           cip.progress.status === 'FAILED' ? 'failed' : 'not-taken'
  }

  const getCourseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-900 hover:bg-green-200'
      case 'in-progress':
        return 'bg-gray-200 border-gray-400 text-gray-800 hover:bg-gray-300'
      case 'failed':
        return 'bg-red-100 border-red-300 text-red-900 hover:bg-red-200'
      default:
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
        <p className="text-blue-100">Major: {plan.major.name} ({plan.major.code})</p>
        {plan.studentLevel && (
          <p className="text-blue-100 mt-1">Current Level: {plan.studentLevel}</p>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 border border-gray-400"></div>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div>
            <span className="text-sm text-gray-600">Not Taken</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
            <span className="text-sm text-gray-600">Failed</span>
          </div>
        </div>
      </div>

      {/* Required Courses - Semesters 1-8 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => {
            const courses = coursesBySemester[semester].filter(cip => cip.isRequired)
            return (
              <div key={semester} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                  Level {semester}
                  {plan.studentLevel === semester && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Current</span>
                  )}
                </h4>
                <div className="space-y-2">
                  {courses.length === 0 ? (
                    <p className="text-xs text-gray-400">No courses</p>
                  ) : (
                    courses
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map(cip => {
                        const status = getCourseStatus(cip)
                        const hasPrerequisites = cip.course.prerequisites && cip.course.prerequisites.length > 0
                        return (
                          <div
                            key={cip.id}
                            onClick={() => onCourseClick?.(cip)}
                            className={`
                              ${getCourseColor(status)}
                              border rounded-md p-2 text-xs cursor-pointer transition-all
                              ${onCourseClick ? 'hover:shadow-md' : ''}
                            `}
                            title={cip.course.name}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{cip.course.code}</div>
                                <div className="text-[10px] opacity-80 truncate mt-0.5">
                                  {cip.course.name}
                                </div>
                                <div className="text-[10px] opacity-60 mt-0.5">
                                  {cip.course.credits} CH
                                </div>
                              </div>
                              {hasPrerequisites && (
                                <svg
                                  className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-60"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <title>{`Prerequisites: ${cip.course.prerequisites?.map(p => p.prerequisiteCourse.code).join(', ')}`}</title>
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                              )}
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Electives */}
      {Object.keys(electivesByGroup).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Elective Courses</h3>
          <div className="space-y-6">
            {Object.entries(electivesByGroup).map(([groupCode, courses]) => {
              const groupName = courses[0]?.course.electiveGroup?.name || groupCode
              return (
                <div key={groupCode} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">{groupName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {courses.map(cip => {
                      const status = getCourseStatus(cip)
                      return (
                        <div
                          key={cip.id}
                          onClick={() => onCourseClick?.(cip)}
                          className={`
                            ${getCourseColor(status)}
                            border rounded-md p-2 text-xs cursor-pointer transition-all
                            ${onCourseClick ? 'hover:shadow-md' : ''}
                          `}
                          title={cip.course.name}
                        >
                          <div className="font-semibold truncate">{cip.course.code}</div>
                          <div className="text-[10px] opacity-80 truncate mt-0.5">
                            {cip.course.name}
                          </div>
                          <div className="text-[10px] opacity-60 mt-0.5">
                            {cip.course.credits} CH
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

