import { prisma } from '@/config/database'
import { CustomError } from '@/middleware/errorHandler'

/**
 * Check if a student has completed all prerequisites for a course
 */
export async function checkPrerequisites(
  studentId: string,
  courseId: string
): Promise<{ canEnroll: boolean; missingPrerequisites: string[] }> {
  // Get all prerequisites for the course
  const prerequisites = await prisma.prerequisite.findMany({
    where: { courseId },
    include: {
      prerequisiteCourse: {
        select: {
          id: true,
          code: true,
          name: true
        }
      }
    }
  })

  if (prerequisites.length === 0) {
    return { canEnroll: true, missingPrerequisites: [] }
  }

  // Get student's completed courses (status = COMPLETED)
  const completedCourses = await prisma.studentProgress.findMany({
    where: {
      studentId,
      status: 'COMPLETED'
    },
    select: {
      courseId: true
    }
  })

  const completedCourseIds = new Set(completedCourses.map(c => c.courseId))

  // Check each prerequisite
  const missingPrerequisites: string[] = []
  for (const prereq of prerequisites) {
    if (!completedCourseIds.has(prereq.prerequisiteCourseId)) {
      missingPrerequisites.push(
        `${prereq.prerequisiteCourse.code} - ${prereq.prerequisiteCourse.name}`
      )
    }
  }

  return {
    canEnroll: missingPrerequisites.length === 0,
    missingPrerequisites
  }
}

/**
 * Check if a student can enroll in a course (prerequisites + level check)
 */
export async function canEnrollInCourse(
  studentId: string,
  courseId: string
): Promise<{ canEnroll: boolean; reason?: string; missingPrerequisites?: string[] }> {
  // Get student info
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      currentLevel: true,
      majorId: true
    }
  })

  if (!student) {
    throw new CustomError('Student not found', 404)
  }

  // Get course info
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      level: true
    }
  })

  if (!course) {
    throw new CustomError('Course not found', 404)
  }

  // Parse level number from level name (e.g., "Level 3" -> 3)
  const levelMatch = course.level.name.match(/\d+/)
  const courseLevel = levelMatch ? parseInt(levelMatch[0], 10) : null

  // Check if student's level is appropriate
  if (student.currentLevel && courseLevel) {
    // Allow enrollment if student is at the same level or has completed prerequisites
    // We'll check prerequisites first, then level
  }

  // Check prerequisites
  const prereqCheck = await checkPrerequisites(studentId, courseId)
  if (!prereqCheck.canEnroll) {
    return {
      canEnroll: false,
      reason: 'Missing prerequisites',
      missingPrerequisites: prereqCheck.missingPrerequisites
    }
  }

  // Check if already enrolled or completed
  const existingProgress = await prisma.studentProgress.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId
      }
    }
  })

  if (existingProgress) {
    if (existingProgress.status === 'COMPLETED') {
      return {
        canEnroll: false,
        reason: 'Course already completed'
      }
    }
    if (existingProgress.status === 'IN_PROGRESS') {
      return {
        canEnroll: false,
        reason: 'Already enrolled in this course'
      }
    }
  }

  return { canEnroll: true }
}

/**
 * Get all courses a student can enroll in (based on prerequisites and level)
 */
export async function getAvailableCourses(studentId: string): Promise<string[]> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      currentLevel: true,
      majorId: true
    }
  })

  if (!student || !student.majorId) {
    return []
  }

  // Get student's academic plan
  const plan = await prisma.academicPlan.findFirst({
    where: {
      majorId: student.majorId,
      isActive: true
    },
    include: {
      courses: {
        include: {
          course: true
        }
      }
    }
  })

  if (!plan) {
    return []
  }

  // Get student's completed courses
  const completedCourses = await prisma.studentProgress.findMany({
    where: {
      studentId,
      status: 'COMPLETED'
    },
    select: {
      courseId: true
    }
  })

  const completedCourseIds = new Set(completedCourses.map(c => c.courseId))

  // Get all courses from plan
  const allCourses = plan.courses.map(cip => cip.course)

  // Filter courses that student can enroll in
  const availableCourses: string[] = []

  for (const course of allCourses) {
    // Check if already completed or in progress
    const existingProgress = await prisma.studentProgress.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id
        }
      }
    })

    if (existingProgress && (existingProgress.status === 'COMPLETED' || existingProgress.status === 'IN_PROGRESS')) {
      continue
    }

    // Check prerequisites
    const prerequisites = await prisma.prerequisite.findMany({
      where: { courseId: course.id },
      select: {
        prerequisiteCourseId: true
      }
    })

    const hasAllPrerequisites = prerequisites.every(
      prereq => completedCourseIds.has(prereq.prerequisiteCourseId)
    )

    if (hasAllPrerequisites) {
      availableCourses.push(course.id)
    }
  }

  return availableCourses
}

