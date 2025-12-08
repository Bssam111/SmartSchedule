import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireAdmin, requireCommittee } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { canEnrollInCourse, checkPrerequisites } from '@/utils/prerequisites'
import { z } from 'zod'

const router = Router()

const enrollSchema = z.object({
  sectionId: z.string(),
  courseId: z.string()
})

const dropSchema = z.object({
  sectionId: z.string()
})

/**
 * GET /api/enrollment/student/:studentId
 * Get student's current enrollments
 */
router.get('/student/:studentId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params

    // Verify access: student can only see their own, admin/committee can see any
    if (req.user?.role === 'STUDENT' && req.user.id !== studentId) {
      throw new CustomError('Unauthorized', 403)
    }

    const assignments = await prisma.assignment.findMany({
      where: {
        studentId,
        status: 'ENROLLED'
      },
      include: {
        course: {
          include: {
            level: true,
            electiveGroup: true
          }
        },
        section: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            room: true,
            meetings: true
          }
        },
        grade: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/enrollment/enroll
 * Enroll a student in a course section
 */
router.post('/enroll', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const data = enrollSchema.parse(req.body)
    const studentId = req.user?.id

    if (!studentId) {
      throw new CustomError('Unauthorized', 401)
    }

    // Check if registration window is open
    const now = new Date()
    const registrationWindow = await prisma.registrationWindow.findFirst({
      where: {
        isOpen: true,
        allowAddDrop: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    })

    if (!registrationWindow && req.user?.role === 'STUDENT') {
      throw new CustomError('Registration window is not open', 400)
    }

    // Verify section exists
    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
      include: {
        course: true,
        assignments: {
          where: {
            status: 'ENROLLED'
          }
        }
      }
    })

    if (!section) {
      throw new CustomError('Section not found', 404)
    }

    // Verify course matches section
    if (section.courseId !== data.courseId) {
      throw new CustomError('Course does not match section', 400)
    }

    // Check prerequisites (unless admin/committee override)
    if (req.user?.role === 'STUDENT') {
      const enrollmentCheck = await canEnrollInCourse(studentId, data.courseId)
      if (!enrollmentCheck.canEnroll) {
        throw new CustomError(
          enrollmentCheck.reason || 'Cannot enroll in this course',
          400
        )
      }
    }

    // Check section capacity
    const currentEnrollments = section.assignments.length
    const maxCapacity = registrationWindow?.maxStudentCapacity ?? 30

    if (currentEnrollments >= maxCapacity && req.user?.role === 'STUDENT') {
      throw new CustomError('Section is full', 400)
    }

    // Check if already enrolled
    const existing = await prisma.assignment.findUnique({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId: data.sectionId
        }
      }
    })

    if (existing && existing.status !== 'DROPPED') {
      throw new CustomError('Already enrolled in this section', 409)
    }

    // Create or update assignment
    const assignment = await prisma.assignment.upsert({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId: data.sectionId
        }
      },
      create: {
        studentId,
        sectionId: data.sectionId,
        courseId: data.courseId,
        status: 'ENROLLED'
      },
      update: {
        status: 'ENROLLED'
      },
      include: {
        course: {
          include: {
            level: true
          }
        },
        section: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Update or create student progress
    await prisma.studentProgress.upsert({
      where: {
        studentId_courseId: {
          studentId,
          courseId: data.courseId
        }
      },
      create: {
        studentId,
        courseId: data.courseId,
        planId: await getStudentPlanId(studentId),
        status: 'ENROLLED'
      },
      update: {
        status: 'ENROLLED'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: assignment
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/enrollment/drop
 * Drop a course
 */
router.post('/drop', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const data = dropSchema.parse(req.body)
    const studentId = req.user?.id

    if (!studentId) {
      throw new CustomError('Unauthorized', 401)
    }

    // Check if registration window is open (unless admin/committee)
    if (req.user?.role === 'STUDENT') {
      const now = new Date()
      const registrationWindow = await prisma.registrationWindow.findFirst({
        where: {
          isOpen: true,
          allowAddDrop: true,
          startDate: { lte: now },
          endDate: { gte: now }
        }
      })

      if (!registrationWindow) {
        throw new CustomError('Registration window is not open', 400)
      }
    }

    // Find assignment
    const assignment = await prisma.assignment.findUnique({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId: data.sectionId
        }
      },
      include: {
        course: true
      }
    })

    if (!assignment) {
      throw new CustomError('Enrollment not found', 404)
    }

    if (assignment.status === 'DROPPED') {
      throw new CustomError('Course already dropped', 400)
    }

    // Update assignment status
    await prisma.assignment.update({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId: data.sectionId
        }
      },
      data: {
        status: 'DROPPED'
      }
    })

    // Update student progress
    await prisma.studentProgress.updateMany({
      where: {
        studentId,
        courseId: assignment.courseId,
        status: 'ENROLLED'
      },
      data: {
        status: 'NOT_TAKEN'
      }
    })

    res.json({
      success: true,
      message: 'Successfully dropped course'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/enrollment/auto-enroll/:studentId
 * Auto-enroll student in level-appropriate courses (Admin/Committee only)
 */
router.post('/auto-enroll/:studentId', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params

    const result = await autoEnrollStudent(studentId)

    res.json({
      success: true,
      message: `Auto-enrolled student in ${result.enrolledCount} courses`,
      data: result
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Helper function to get student's plan ID
 */
async function getStudentPlanId(studentId: string): Promise<string> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { majorId: true }
  })

  if (!student || !student.majorId) {
    throw new CustomError('Student has no major assigned', 400)
  }

  const plan = await prisma.academicPlan.findFirst({
    where: {
      majorId: student.majorId,
      isActive: true
    },
    select: { id: true }
  })

  if (!plan) {
    throw new CustomError('Academic plan not found for student\'s major', 404)
  }

  return plan.id
}

/**
 * Auto-enroll a student in level-appropriate courses
 */
export async function autoEnrollStudent(studentId: string) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      currentLevel: true,
      majorId: true
    }
  })

  if (!student || !student.majorId) {
    throw new CustomError('Student not found or has no major', 404)
  }

  const level = student.currentLevel || 1

  // Get academic plan
  const plan = await prisma.academicPlan.findFirst({
    where: {
      majorId: student.majorId,
      isActive: true
    },
    include: {
      courses: {
        where: {
          semester: level
        },
        include: {
          course: {
            include: {
              sections: {
                include: {
                  instructor: true
                },
                take: 1 // Get first available section
              }
            }
          }
        }
      }
    }
  })

  if (!plan) {
    throw new CustomError('Academic plan not found', 404)
  }

  const enrolledCourses: string[] = []
  const skippedCourses: string[] = []

  for (const courseInPlan of plan.courses) {
    const course = courseInPlan.course

    // Check prerequisites
    const enrollmentCheck = await canEnrollInCourse(studentId, course.id)
    if (!enrollmentCheck.canEnroll) {
      skippedCourses.push(course.code)
      continue
    }

    // Check if already enrolled
    const existingProgress = await prisma.studentProgress.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id
        }
      }
    })

    if (existingProgress && existingProgress.status !== 'NOT_TAKEN') {
      continue
    }

    // Get first available section
    if (course.sections.length === 0) {
      skippedCourses.push(course.code)
      continue
    }

    const section = course.sections[0]

    // Check section capacity
    const currentEnrollments = await prisma.assignment.count({
      where: {
        sectionId: section.id,
        status: 'ENROLLED'
      }
    })

    if (currentEnrollments >= 30) {
      skippedCourses.push(course.code)
      continue
    }

    // Enroll student
    await prisma.assignment.upsert({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId: section.id
        }
      },
      create: {
        studentId,
        sectionId: section.id,
        courseId: course.id,
        status: 'ENROLLED'
      },
      update: {
        status: 'ENROLLED'
      }
    })

    // Update student progress
    await prisma.studentProgress.upsert({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id
        }
      },
      create: {
        studentId,
        courseId: course.id,
        planId: plan.id,
        status: 'ENROLLED'
      },
      update: {
        status: 'ENROLLED'
      }
    })

    enrolledCourses.push(course.code)
  }

  return {
    enrolledCount: enrolledCourses.length,
    enrolledCourses,
    skippedCount: skippedCourses.length,
    skippedCourses
  }
}

export { router as enrollmentRoutes }

