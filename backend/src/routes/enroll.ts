import { Router } from 'express'
import { prisma } from '@/config/database'
import { createAssignmentSchema } from '@/utils/validation'
import { authenticateToken, requireStudent, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// POST /api/enroll
router.post('/', authenticateToken, requireStudent, async (req: AuthRequest, res, next) => {
  try {
    const { sectionId } = createAssignmentSchema.parse(req.body)

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        assignments: true
      }
    })

    if (!section) {
      throw new CustomError('Section not found', 404)
    }

    // Check if student is already enrolled
    const existingAssignment = await prisma.assignment.findUnique({
      where: {
        studentId_sectionId: {
          studentId: req.user!.id,
          sectionId: sectionId
        }
      }
    })

    if (existingAssignment) {
      throw new CustomError('Already enrolled in this section', 409)
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        studentId: req.user!.id,
        sectionId: sectionId,
        courseId: section.courseId
      },
      include: {
        section: {
          include: {
            course: true,
            instructor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: assignment
    })
  } catch (error) {
    next(error)
  }
})

export { router as enrollRoutes }
