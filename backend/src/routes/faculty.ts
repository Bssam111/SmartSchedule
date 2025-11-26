import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, requireFaculty, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/faculty/assignments
router.get('/assignments', authenticateToken, requireFaculty, async (req: AuthRequest, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      where: {
        instructorId: req.user!.id
      },
      include: {
        course: true,
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: sections
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/faculty/availability
router.get('/availability', authenticateToken, requireFaculty, async (req: AuthRequest, res, next) => {
  try {
    const { facultyId } = req.query

    // Faculty can only view their own availability unless they're committee
    const targetFacultyId = facultyId as string || req.user!.id
    if (targetFacultyId !== req.user!.id && req.user!.role !== 'COMMITTEE') {
      throw new CustomError('Access denied', 403)
    }

    const preferences = await prisma.preference.findMany({
      where: {
        userId: targetFacultyId,
        type: 'availability'
      }
    })

    res.json({
      success: true,
      data: preferences
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/faculty/availability
router.post('/availability', authenticateToken, requireFaculty, async (req: AuthRequest, res, next) => {
  try {
    const { availability } = req.body

    // Update or create availability preferences
    // First try to find existing preference
    const existing = await prisma.preference.findFirst({
      where: {
        userId: req.user!.id,
        type: 'availability'
      }
    })

    if (existing) {
      await prisma.preference.update({
        where: { id: existing.id },
        data: { value: JSON.stringify(availability) }
      })
    } else {
      await prisma.preference.create({
        data: {
          userId: req.user!.id,
          type: 'availability',
          value: JSON.stringify(availability)
        }
      })
    }
      update: {
        value: JSON.stringify(availability)
      },
      create: {
        userId: req.user!.id,
        type: 'availability',
        value: JSON.stringify(availability)
      }
    })

    res.json({
      success: true,
      message: 'Availability updated successfully'
    })
  } catch (error) {
    next(error)
  }
})

export { router as facultyRoutes }
