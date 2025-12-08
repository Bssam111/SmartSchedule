import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireAdmin } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const router = Router()

const createSemesterSchema = z.object({
  academicYear: z.string().regex(/^\d{4}\/\d{4}$/, 'Academic year must be in format YYYY/YYYY'),
  semesterNumber: z.number().int().min(1).max(2),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

const setCurrentSemesterSchema = z.object({
  semesterId: z.string()
})

const createRegistrationWindowSchema = z.object({
  semesterId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  allowAddDrop: z.boolean().default(true),
  maxRoomCapacity: z.number().int().min(1).max(100).default(40),
  maxStudentCapacity: z.number().int().min(1).max(50).default(30)
})

const updateRegistrationWindowSchema = z.object({
  isOpen: z.boolean().optional(),
  allowAddDrop: z.boolean().optional(),
  maxRoomCapacity: z.number().int().min(1).max(100).optional(),
  maxStudentCapacity: z.number().int().min(1).max(50).optional()
})

/**
 * GET /api/semesters
 * Get all semesters
 */
router.get('/', authenticateToken, async (_req: AuthRequest, res, next) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: [
        { academicYear: 'desc' },
        { semesterNumber: 'desc' }
      ],
      include: {
        registrationWindows: {
          orderBy: { startDate: 'desc' },
          take: 1 // Get the most recent window
        }
      }
    })

    res.json({
      success: true,
      data: semesters
    })
  } catch (error: any) {
    console.error('[Semesters] Error fetching semesters:', error)
    console.error('[Semesters] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    })
    next(error)
  }
})

/**
 * GET /api/semesters/current
 * Get current semester
 */
router.get('/current', authenticateToken, async (_req: AuthRequest, res, next) => {
  try {
    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true },
      include: {
        registrationWindows: {
          where: {
            isOpen: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      }
    })

    if (!currentSemester) {
      return res.json({
        success: true,
        data: null,
        message: 'No current semester set'
      })
    }

    res.json({
      success: true,
      data: currentSemester
    })
  } catch (error: any) {
    console.error('[Semesters] Error fetching current semester:', error)
    console.error('[Semesters] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    })
    next(error)
  }
})

/**
 * POST /api/semesters
 * Create a new semester (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createSemesterSchema.parse(req.body)
    const name = `${data.academicYear} Semester ${data.semesterNumber}`

    // Check if semester already exists
    const existing = await prisma.semester.findUnique({
      where: {
        academicYear_semesterNumber: {
          academicYear: data.academicYear,
          semesterNumber: data.semesterNumber
        }
      }
    })

    if (existing) {
      throw new CustomError('Semester already exists', 409)
    }

    const semester = await prisma.semester.create({
      data: {
        academicYear: data.academicYear,
        semesterNumber: data.semesterNumber,
        name,
        isCurrent: false,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null
      }
    })

    res.status(201).json({
      success: true,
      message: 'Semester created successfully',
      data: semester
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/semesters/set-current
 * Set the current semester (Admin only)
 * This resets the system: closes previous semester, deletes all sections, and reassigns courses
 */
router.post('/set-current', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = setCurrentSemesterSchema.parse(req.body)

    // Verify semester exists
    const newSemester = await prisma.semester.findUnique({
      where: { id: data.semesterId }
    })

    if (!newSemester) {
      throw new CustomError('Semester not found', 404)
    }

    // Get the previous current semester (if any)
    const previousSemester = await prisma.semester.findFirst({
      where: { isCurrent: true }
    })

    // Step 1: Close the previous semester if it exists
    if (previousSemester && previousSemester.id !== data.semesterId) {
      console.log(`[SetCurrent] Closing previous semester: ${previousSemester.name}`)
      
      // Close the previous semester (calculate grades)
      try {
        await closeSemesterLogic(previousSemester.id)
      } catch (closeError) {
        console.error('[SetCurrent] Error closing previous semester:', closeError)
        // Continue anyway - don't block semester change
      }
    }

    // Step 2: Copy course-faculty assignments from previous semester
    if (previousSemester && previousSemester.id !== data.semesterId) {
      console.log('[SetCurrent] Copying course-faculty assignments from previous semester...')
      
      // Get all course-faculty assignments from previous semester
      const previousAssignments = await prisma.courseFaculty.findMany({
        where: { semesterId: previousSemester.id },
        select: {
          courseId: true,
          facultyId: true
        }
      })
      
      // Copy assignments to new semester
      if (previousAssignments.length > 0) {
        await prisma.courseFaculty.createMany({
          data: previousAssignments.map((a: { courseId: string; facultyId: string }) => ({
            courseId: a.courseId,
            facultyId: a.facultyId,
            semesterId: data.semesterId
          })),
          skipDuplicates: true // Skip if assignment already exists
        })
        console.log(`[SetCurrent] Copied ${previousAssignments.length} course-faculty assignments to new semester`)
      }
    }

    // Step 3: Delete all sections (reset system)
    console.log('[SetCurrent] Deleting all sections...')
    const deletedSections = await prisma.section.deleteMany({})
    console.log(`[SetCurrent] Deleted ${deletedSections.count} sections`)

    // Step 4: Unset all current semesters
    await prisma.semester.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false }
    })

    // Step 5: Set the selected semester as current
    const updated = await prisma.semester.update({
      where: { id: data.semesterId },
      data: { isCurrent: true }
    })

    // Step 6: Trigger intelligent course assignment for all students
    // This will create new sections and reassign courses based on student progress
    // Course-faculty assignments are already copied, so sections can use those faculty
    // Run this asynchronously to not block the response
    setImmediate(async () => {
      try {
        const { intelligentCourseAssignment } = await import('@/services/intelligent-enrollment')
        const result = await intelligentCourseAssignment()
        console.log('[SetCurrent] Intelligent enrollment completed:', result)
      } catch (error) {
        console.error('[SetCurrent] Error running intelligent enrollment:', error)
        // Don't throw - this is a background process
      }
    })

    res.json({
      success: true,
      message: `${updated.name} set as current semester. System reset: ${deletedSections.count} sections deleted. Courses will be reassigned.`,
      data: updated
    })
  } catch (error) {
    next(error)
  }
})

// Extract semester closing logic to a reusable function
async function closeSemesterLogic(semesterId: string) {
  const semester = await prisma.semester.findUnique({
    where: { id: semesterId }
  })

  if (!semester) {
    throw new CustomError('Semester not found', 404)
  }

  // Get all assignments for this semester
  // We need to find:
  // 1. Assignments with grades for this semester (by academicYear and semesterNumber)
  // 2. Assignments that are enrolled but don't have grades yet (will get PN)
  // Note: We can't filter by section.semesterId since Section model doesn't have that field
  // Instead, we'll process all enrolled assignments and assignments with matching grades
  const assignmentsWithGrades = await prisma.assignment.findMany({
    where: {
      grade: {
        academicYear: semester.academicYear,
        semester: semester.semesterNumber
      }
    },
    include: {
      student: {
        select: {
          id: true,
          majorId: true
        }
      },
      course: {
        select: {
          id: true,
          credits: true
        }
      },
      grade: {
        where: {
          academicYear: semester.academicYear,
          semester: semester.semesterNumber
        }
      }
    }
  })

  // Process assignments with grades for this semester
  let processedCount = 0
  let passedCount = 0
  let failedCount = 0
  let pendingCount = 0

  for (const assignment of assignmentsWithGrades) {
    try {
      const studentPlan = await prisma.academicPlan.findFirst({
        where: {
          majorId: assignment.student.majorId || undefined,
          isActive: true
        },
        select: { id: true }
      })

      if (!studentPlan) {
        continue
      }

      if (assignment.grade) {
        const numericGrade = assignment.grade.numericGrade
        const isPassing = numericGrade >= 60

        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { status: isPassing ? 'COMPLETED' : 'FAILED' }
        })

        await prisma.studentProgress.upsert({
          where: {
            studentId_courseId: {
              studentId: assignment.studentId,
              courseId: assignment.courseId
            }
          },
          create: {
            studentId: assignment.studentId,
            courseId: assignment.courseId,
            planId: studentPlan.id,
            status: isPassing ? 'COMPLETED' : 'FAILED',
            semesterTaken: semester.semesterNumber,
            gradeId: assignment.grade.id
          },
          update: {
            status: isPassing ? 'COMPLETED' : 'FAILED',
            semesterTaken: semester.semesterNumber,
            gradeId: assignment.grade.id
          }
        })

        if (isPassing) {
          passedCount++
        } else {
          failedCount++
        }
      } else {
        // No grade - create PN grade and mark as FAILED in plan
        const pnGrade = await prisma.grade.upsert({
          where: { assignmentId: assignment.id },
          create: {
            assignmentId: assignment.id,
            studentId: assignment.studentId,
            courseId: assignment.courseId,
            numericGrade: 0,
            letterGrade: 'PN',
            points: 0.0,
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
          },
          update: {
            numericGrade: 0,
            letterGrade: 'PN',
            points: 0.0,
            semester: semester.semesterNumber,
            academicYear: semester.academicYear
          }
        })

        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { status: 'FAILED' }
        })

        await prisma.studentProgress.upsert({
          where: {
            studentId_courseId: {
              studentId: assignment.studentId,
              courseId: assignment.courseId
            }
          },
          create: {
            studentId: assignment.studentId,
            courseId: assignment.courseId,
            planId: studentPlan.id,
            status: 'FAILED',
            semesterTaken: semester.semesterNumber,
            gradeId: pnGrade.id
          },
          update: {
            status: 'FAILED',
            semesterTaken: semester.semesterNumber,
            gradeId: pnGrade.id
          }
        })
        pendingCount++
      }

      processedCount++
    } catch (error) {
      console.error(`[CloseSemester] Error processing assignment ${assignment.id}:`, error)
    }
  }

  // Update semester endDate if not set
  if (!semester.endDate) {
    await prisma.semester.update({
      where: { id: semesterId },
      data: { endDate: new Date() }
    })
  }

  return {
    processed: processedCount,
    passed: passedCount,
    failed: failedCount,
    pending: pendingCount
  }
}

/**
 * POST /api/semesters/registration-windows
 * Create a registration window (Admin only)
 */
router.post('/registration-windows', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createRegistrationWindowSchema.parse(req.body)

    // Verify semester exists
    const semester = await prisma.semester.findUnique({
      where: { id: data.semesterId }
    })

    if (!semester) {
      throw new CustomError('Semester not found', 404)
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      throw new CustomError('End date must be after start date', 400)
    }

    const window = await prisma.registrationWindow.create({
      data: {
        semesterId: data.semesterId,
        startDate,
        endDate,
        allowAddDrop: data.allowAddDrop,
        maxRoomCapacity: data.maxRoomCapacity,
        maxStudentCapacity: data.maxStudentCapacity,
        isOpen: false // Created closed by default
      },
      include: {
        semester: true
      }
    })

    res.status(201).json({
      success: true,
      message: 'Registration window created',
      data: window
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/semesters/registration-windows/:id
 * Update a registration window (Admin only)
 */
router.put('/registration-windows/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const data = updateRegistrationWindowSchema.parse(req.body)

    const window = await prisma.registrationWindow.findUnique({
      where: { id }
    })

    if (!window) {
      throw new CustomError('Registration window not found', 404)
    }

    const updated = await prisma.registrationWindow.update({
      where: { id },
      data: {
        ...(data.isOpen !== undefined && { isOpen: data.isOpen }),
        ...(data.allowAddDrop !== undefined && { allowAddDrop: data.allowAddDrop }),
        ...(data.maxRoomCapacity !== undefined && { maxRoomCapacity: data.maxRoomCapacity }),
        ...(data.maxStudentCapacity !== undefined && { maxStudentCapacity: data.maxStudentCapacity })
      },
      include: {
        semester: true
      }
    })

    res.json({
      success: true,
      message: 'Registration window updated',
      data: updated
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/semesters/registration-windows/active
 * Get active registration window
 */
router.get('/registration-windows/active', authenticateToken, async (_req: AuthRequest, res, next) => {
  try {
    const now = new Date()
    const window = await prisma.registrationWindow.findFirst({
      where: {
        isOpen: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        semester: true
      },
      orderBy: { startDate: 'desc' }
    })

    if (!window) {
      return res.json({
        success: true,
        data: null,
        message: 'No active registration window'
      })
    }

    res.json({
      success: true,
      data: window
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/semesters/:semesterId/close
 * Close a semester and calculate all grades (Admin only)
 */
router.post('/:semesterId/close', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { semesterId } = req.params

    const result = await closeSemesterLogic(semesterId)
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId }
    })

    console.log(`[CloseSemester] Completed: ${result.processed} processed, ${result.passed} passed, ${result.failed} failed, ${result.pending} pending (PN)`)

    res.json({
      success: true,
      message: `Semester ${semester?.name || 'Unknown'} closed successfully`,
      data: {
        semester: semester?.name || 'Unknown',
        ...result
      }
    })
  } catch (error) {
    next(error)
  }
})

export { router as semesterRoutes }

