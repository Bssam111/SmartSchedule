import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, requireFacultyOrCommittee, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const router = Router()

const assignFacultySchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  semesterId: z.string().min(1, 'Semester ID is required')
})

const removeFacultySchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  semesterId: z.string().min(1, 'Semester ID is required')
})

/**
 * GET /api/course-faculty?semesterId=xxx
 * Get all course-faculty assignments for a semester
 */
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { semesterId } = req.query

    if (!semesterId || typeof semesterId !== 'string') {
      throw new CustomError('Semester ID is required', 400)
    }

    const assignments = await prisma.courseFaculty.findMany({
      where: { semesterId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        },
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            universityId: true
          }
        },
        semester: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            semesterNumber: true
          }
        }
      },
      orderBy: {
        course: {
          code: 'asc'
        }
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
 * POST /api/course-faculty
 * Assign a faculty member to a course for a semester
 */
router.post('/', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const data = assignFacultySchema.parse(req.body)

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId }
    })

    if (!course) {
      throw new CustomError('Course not found', 404)
    }

    // Verify faculty exists and is a faculty member
    const faculty = await prisma.user.findUnique({
      where: { id: data.facultyId }
    })

    if (!faculty || faculty.role !== 'FACULTY') {
      throw new CustomError('Invalid faculty member', 400)
    }

    // Verify semester exists
    const semester = await prisma.semester.findUnique({
      where: { id: data.semesterId }
    })

    if (!semester) {
      throw new CustomError('Semester not found', 404)
    }

    // Check if assignment already exists
    const existing = await prisma.courseFaculty.findUnique({
      where: {
        courseId_facultyId_semesterId: {
          courseId: data.courseId,
          facultyId: data.facultyId,
          semesterId: data.semesterId
        }
      }
    })

    if (existing) {
      throw new CustomError('Faculty is already assigned to this course for this semester', 409)
    }

    // Create assignment
    const assignment = await prisma.courseFaculty.create({
      data: {
        courseId: data.courseId,
        facultyId: data.facultyId,
        semesterId: data.semesterId
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        faculty: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Faculty assigned to course successfully',
      data: assignment
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/course-faculty
 * Remove a faculty member from a course for a semester
 */
router.delete('/', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const data = removeFacultySchema.parse(req.body)

    // Find and delete assignment
    const assignment = await prisma.courseFaculty.findUnique({
      where: {
        courseId_facultyId_semesterId: {
          courseId: data.courseId,
          facultyId: data.facultyId,
          semesterId: data.semesterId
        }
      }
    })

    if (!assignment) {
      throw new CustomError('Faculty assignment not found', 404)
    }

    await prisma.courseFaculty.delete({
      where: { id: assignment.id }
    })

    res.json({
      success: true,
      message: 'Faculty removed from course successfully'
    })
  } catch (error) {
    next(error)
  }
})

export default router

