import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireAdmin } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  credits: z.number().min(1).max(6),
  levelId: z.string().min(1, 'Level is required')
})

const updateCourseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  credits: z.number().min(1).max(6).optional(),
  levelId: z.string().min(1).optional()
})

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

// POST /api/courses - Create new course (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createCourseSchema.parse(req.body)

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code: data.code }
    })

    if (existingCourse) {
      throw new CustomError('Course with this code already exists', 409)
    }

    // Verify level exists
    const level = await prisma.level.findUnique({
      where: { id: data.levelId }
    })

    if (!level) {
      throw new CustomError('Level not found', 404)
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        code: data.code,
        name: data.name,
        credits: data.credits,
        levelId: data.levelId
      },
      include: {
        level: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/courses/:id - Update course (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const data = updateCourseSchema.parse(req.body)

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    })

    if (!existingCourse) {
      throw new CustomError('Course not found', 404)
    }

    // Check if code is being changed and if it's already taken
    if (data.code && data.code !== existingCourse.code) {
      const codeTaken = await prisma.course.findUnique({
        where: { code: data.code }
      })
      if (codeTaken) {
        throw new CustomError('Course code already in use', 409)
      }
    }

    // Verify level exists if being updated
    if (data.levelId) {
      const level = await prisma.level.findUnique({
        where: { id: data.levelId }
      })
      if (!level) {
        throw new CustomError('Level not found', 404)
      }
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.credits && { credits: data.credits }),
        ...(data.levelId && { levelId: data.levelId })
      },
      include: {
        level: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/courses/:id - Delete course (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          select: { id: true }
        }
      }
    })

    if (!existingCourse) {
      throw new CustomError('Course not found', 404)
    }

    // Check if course has sections
    if (existingCourse.sections.length > 0) {
      throw new CustomError('Cannot delete course with existing sections', 400)
    }

    // Delete course
    await prisma.course.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

export { router as courseRoutes }




