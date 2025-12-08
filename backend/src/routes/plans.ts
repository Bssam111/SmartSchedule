import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireAdmin } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const router = Router()

const createPlanSchema = z.object({
  majorId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  totalCredits: z.number().int().min(1)
})

const addCourseToPlanSchema = z.object({
  courseId: z.string(),
  semester: z.number().int().min(1).max(8),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().min(0).optional()
})

/**
 * GET /api/plans
 * Get all academic plans
 */
router.get('/', authenticateToken, async (_req: AuthRequest, res, next) => {
  try {
    const plans = await prisma.academicPlan.findMany({
      where: { isActive: true },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        courses: {
          include: {
            course: {
              include: {
                level: true,
                prerequisites: {
                  include: {
                    prerequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true
                      }
                    }
                  }
                },
                corequisites: {
                  include: {
                    corequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { semester: 'asc' },
            { displayOrder: 'asc' }
          ]
        }
      },
      orderBy: { name: 'asc' }
    })

    res.json({
      success: true,
      data: plans
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/plans/:id
 * Get academic plan by ID
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    const plan = await prisma.academicPlan.findUnique({
      where: { id },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        courses: {
          include: {
            course: {
              include: {
                level: true,
                prerequisites: {
                  include: {
                    prerequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        credits: true
                      }
                    }
                  }
                },
                corequisites: {
                  include: {
                    corequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        credits: true
                      }
                    }
                  }
                },
                electiveGroup: true
              }
            }
          },
          orderBy: [
            { semester: 'asc' },
            { displayOrder: 'asc' }
          ]
        }
      }
    })

    if (!plan) {
      throw new CustomError('Academic plan not found', 404)
    }

    res.json({
      success: true,
      data: plan
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/plans/major/:majorId
 * Get academic plan for a specific major
 */
router.get('/major/:majorId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { majorId } = req.params

    const plan = await prisma.academicPlan.findFirst({
      where: {
        majorId,
        isActive: true
      },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        courses: {
          include: {
            course: {
              include: {
                level: true,
                prerequisites: {
                  include: {
                    prerequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        credits: true
                      }
                    }
                  }
                },
                corequisites: {
                  include: {
                    corequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        credits: true
                      }
                    }
                  }
                },
                electiveGroup: true
              }
            }
          },
          orderBy: [
            { semester: 'asc' },
            { displayOrder: 'asc' }
          ]
        }
      }
    })

    if (!plan) {
      throw new CustomError('Academic plan not found for this major', 404)
    }

    res.json({
      success: true,
      data: plan
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/plans/student/:studentId
 * Get student's academic plan with progress
 */
router.get('/student/:studentId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params

    // Verify student exists and get their major
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        majorId: true,
        currentLevel: true
      }
    })

    if (!student) {
      throw new CustomError('Student not found', 404)
    }

    if (!student.majorId) {
      throw new CustomError('Student has no major assigned', 400)
    }

    // Get the academic plan
    const plan = await prisma.academicPlan.findFirst({
      where: {
        majorId: student.majorId,
        isActive: true
      },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        courses: {
          include: {
            course: {
              include: {
                level: true,
                prerequisites: {
                  include: {
                    prerequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        credits: true
                      }
                    }
                  }
                },
                corequisites: {
                  include: {
                    corequisiteCourse: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        credits: true
                      }
                    }
                  }
                },
                electiveGroup: true
              }
            }
          },
          orderBy: [
            { semester: 'asc' },
            { displayOrder: 'asc' }
          ]
        }
      }
    })

    if (!plan) {
      throw new CustomError('Academic plan not found for this major', 404)
    }

    // Get current semester to check if it's closed
    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true },
      select: {
        id: true,
        endDate: true,
        academicYear: true,
        semesterNumber: true
      }
    })

    // Check if current semester is closed (endDate has passed)
    const isSemesterClosed = currentSemester 
      ? (currentSemester.endDate ? new Date(currentSemester.endDate) < new Date() : false)
      : true // If no current semester, consider it "closed" for display purposes

    // Get student progress
    const progress = await prisma.studentProgress.findMany({
      where: {
        studentId,
        planId: plan.id
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    })

    // Also get all grades for this student to check if there are grades not in StudentProgress
    const allGrades = await prisma.grade.findMany({
      where: {
        studentId
      },
      select: {
        id: true,
        courseId: true,
        numericGrade: true,
        letterGrade: true
      }
    })

    // Create a map of courseId -> best grade (highest numeric grade)
    const gradesMap = new Map<string, { numericGrade: number; letterGrade: string | null }>()
    allGrades.forEach(grade => {
      const existing = gradesMap.get(grade.courseId)
      if (!existing || (grade.numericGrade > existing.numericGrade)) {
        gradesMap.set(grade.courseId, {
          numericGrade: grade.numericGrade,
          letterGrade: grade.letterGrade
        })
      }
    })

    // Map progress by course ID
    const progressMap = new Map(
      progress.map(p => [p.courseId, p])
    )

    // Enrich plan courses with student progress
    // Status is based on grade: >= 60 = COMPLETED (green), < 60 = FAILED (red)
    const enrichedCourses = plan.courses.map((cip) => {
      const courseProgress = progressMap.get(cip.course.id)
      const courseGrade = gradesMap.get(cip.course.id)
      
      // If there's a grade, determine status based on grade value
      let finalStatus = courseProgress?.status || 'NOT_TAKEN'
      
      if (courseGrade) {
        // Grade exists - determine status based on numeric grade
        if (courseGrade.numericGrade >= 60) {
          finalStatus = 'COMPLETED'
        } else if (courseGrade.numericGrade > 0) {
          // Grade exists but < 60
          finalStatus = 'FAILED'
        } else if (courseGrade.letterGrade === 'PN') {
          // PN grade (not entered)
          finalStatus = 'FAILED'
        }
      }
      
      // Return progress with updated status based on grade
      return {
        ...cip,
        progress: courseProgress ? {
          id: courseProgress.id,
          status: finalStatus as 'NOT_TAKEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
          semesterTaken: courseProgress.semesterTaken || undefined,
          gradeId: courseProgress.gradeId || undefined
        } : (courseGrade ? {
          id: '',
          status: finalStatus as 'NOT_TAKEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
          semesterTaken: undefined,
          gradeId: undefined
        } : null)
      }
    })

    res.json({
      success: true,
      data: {
        ...plan,
        courses: enrichedCourses,
        studentLevel: student.currentLevel || 1
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/plans
 * Create a new academic plan (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createPlanSchema.parse(req.body)

    // Verify major exists
    const major = await prisma.major.findUnique({
      where: { id: data.majorId }
    })

    if (!major) {
      throw new CustomError('Major not found', 404)
    }

    // Deactivate existing plans for this major
    await prisma.academicPlan.updateMany({
      where: { majorId: data.majorId, isActive: true },
      data: { isActive: false }
    })

    const plan = await prisma.academicPlan.create({
      data: {
        majorId: data.majorId,
        name: data.name,
        description: data.description,
        totalCredits: data.totalCredits
      },
      include: {
        major: true
      }
    })

    res.status(201).json({
      success: true,
      message: 'Academic plan created',
      data: plan
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/plans/:id/courses
 * Add a course to an academic plan (Admin only)
 */
router.post('/:id/courses', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const data = addCourseToPlanSchema.parse(req.body)

    // Verify plan exists
    const plan = await prisma.academicPlan.findUnique({
      where: { id }
    })

    if (!plan) {
      throw new CustomError('Academic plan not found', 404)
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId }
    })

    if (!course) {
      throw new CustomError('Course not found', 404)
    }

    // Check if course already in plan
    const existing = await prisma.courseInPlan.findUnique({
      where: {
        planId_courseId: {
          planId: id,
          courseId: data.courseId
        }
      }
    })

    if (existing) {
      throw new CustomError('Course already in plan', 409)
    }

    // Get max display order for this semester
    const maxOrder = await prisma.courseInPlan.findFirst({
      where: {
        planId: id,
        semester: data.semester
      },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })

    const courseInPlan = await prisma.courseInPlan.create({
      data: {
        planId: id,
        courseId: data.courseId,
        semester: data.semester,
        isRequired: data.isRequired,
        displayOrder: data.displayOrder ?? ((maxOrder?.displayOrder ?? -1) + 1)
      },
      include: {
        course: {
          include: {
            level: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Course added to plan',
      data: courseInPlan
    })
  } catch (error) {
    next(error)
  }
})

export { router as planRoutes }

