'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'
import { AppHeader } from '../../../components/AppHeader'
import { AcademicPlanGrid } from '../../../components/AcademicPlanGrid'
import { useToast, ToastContainer } from '../../../components/Toast'
import { PrerequisiteModal } from '../../../components/PrerequisiteModal'

interface CourseInPlan {
  id: string
  semester: number
  isRequired: boolean
  displayOrder: number
  course: {
    id: string
    code: string
    name: string
    credits: number
    courseType: 'REQUIRED' | 'UNIVERSITY_ELECTIVE' | 'MATH_ELECTIVE' | 'SCIENCE_ELECTIVE' | 'DEPT_ELECTIVE'
    prerequisites?: Array<{ prerequisiteCourse: { code: string; name: string } }>
    corequisites?: Array<{ corequisiteCourse: { code: string; name: string } }>
    electiveGroup?: { name: string; code: string }
  }
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

export default function AcademicPlanPage() {
  const { getCurrentUser } = useAuth()
  const user = getCurrentUser()
  const [plan, setPlan] = useState<AcademicPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast } = useToast()
  const [selectedCourse, setSelectedCourse] = useState<CourseInPlan | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const loadAcademicPlan = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        
        let response
        try {
          response = await fetch(`${API_BASE_URL}/plans/student/${user.id}`, {
            credentials: 'include'
          })
        } catch (fetchError) {
          console.error('Network error loading academic plan:', fetchError)
          setPlan(null)
          return
        }

        if (!response.ok) {
          console.error('Failed to load academic plan:', response.status, response.statusText)
          setPlan(null)
          return
        }

        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error('Error parsing academic plan response:', jsonError)
          setPlan(null)
          return
        }

        if (data.success && data.data) {
          setPlan(data.data)
        } else {
          setPlan(null)
        }
      } catch (error) {
        console.error('Error loading academic plan:', error)
        setPlan(null)
      } finally {
        setLoading(false)
      }
    }

    loadAcademicPlan()
  }, [user?.id])

  const handleCourseClick = (courseInPlan: CourseInPlan) => {
    // Show modal if course has prerequisites or corequisites
    if (
      (courseInPlan.course.prerequisites && courseInPlan.course.prerequisites.length > 0) ||
      (courseInPlan.course.corequisites && courseInPlan.course.corequisites.length > 0)
    ) {
      setSelectedCourse(courseInPlan)
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCourse(null)
  }

  return (
    <ProtectedRoute requiredRole="student">
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Academic Plan" showBack={true} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Academic Plan</h1>
            <p className="mt-2 text-gray-600">
              View your complete course progression through all 8 levels
            </p>
          </div>

          <AcademicPlanGrid
            plan={plan}
            loading={loading}
            onCourseClick={handleCourseClick}
          />
        </div>

        {/* Prerequisite Modal */}
        {selectedCourse && (
          <PrerequisiteModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            courseCode={selectedCourse.course?.code || 'N/A'}
            courseName={selectedCourse.course?.name || 'Unknown Course'}
            prerequisites={selectedCourse.course?.prerequisites || []}
            corequisites={selectedCourse.course?.corequisites || []}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

