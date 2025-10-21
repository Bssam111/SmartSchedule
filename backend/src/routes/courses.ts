import { Router } from 'express'
import { prisma } from '@/config/database'
import { createCourseSchema, updateCourseSchema } from '@/utils/validation'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { requireCourseCreate, requireCourseUpdate, requireCourseDelete } from '@/middleware/rbac'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/courses
router.get('/', async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        level: true
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

// GET /api/courses/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        level: true,
        sections: {
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

// POST /api/courses
router.post('/', authenticateToken, requireCourseCreate, async (req: AuthRequest, res, next) => {
  try {
    const courseData = createCourseSchema.parse(req.body)

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code: courseData.code }
    })

    if (existingCourse) {
      throw new CustomError('Course with this code already exists', 409)
    }

    const course = await prisma.course.create({
      data: courseData,
      include: {
        level: true
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

// PUT /api/courses/:id
router.put('/:id', authenticateToken, requireCourseUpdate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const courseData = updateCourseSchema.parse(req.body)

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id }
    })

    if (!existingCourse) {
      throw new CustomError('Course not found', 404)
    }

    // Check if new code conflicts with existing course
    if (courseData.code && courseData.code !== existingCourse.code) {
      const codeConflict = await prisma.course.findUnique({
        where: { code: courseData.code }
      })

      if (codeConflict) {
        throw new CustomError('Course with this code already exists', 409)
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: courseData,
      include: {
        level: true
      }
    })

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/courses/:id
router.delete('/:id', authenticateToken, requireCourseDelete, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        sections: true
      }
    })

    if (!course) {
      throw new CustomError('Course not found', 404)
    }

    // Check if course has sections
    if (course.sections.length > 0) {
      throw new CustomError('Cannot delete course with existing sections', 400)
    }

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
