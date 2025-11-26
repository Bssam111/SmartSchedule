import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/courses - Get all courses
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        level: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    res.json({
      success: true,
      data: courses
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/courses/:id - Get course by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        level: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!course) {
      throw new CustomError('Course not found', 404)
    }

    res.json({
      success: true,
      data: course
    })
  } catch (error) {
    next(error)
  }
})

export { router as courseRoutes }


