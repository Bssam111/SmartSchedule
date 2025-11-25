import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/students
router.get('/', async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        universityId: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json({
      success: true,
      data: students
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/students/search
router.get('/search', async (req, res, next) => {
  try {
    const { q, universityId } = req.query

    if (universityId && typeof universityId === 'string') {
      const students = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          universityId: {
            startsWith: universityId,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          universityId: true
        },
        take: 10
      })

      return res.json({
        success: true,
        data: students
      })
    }

    // Otherwise, use text search
    if (!q || typeof q !== 'string') {
      return res.json({
        success: true,
        data: []
      })
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { universityId: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        universityId: true
      },
      take: 10
    })

    res.json({
      success: true,
      data: students
    })
  } catch (error) {
    next(error)
  }
})

const resolveTargetStudentId = (req: AuthRequest, paramId: string) => {
  // Handle 'me' endpoint - always use authenticated user's ID
  const targetId = paramId === 'me' ? req.user!.id : paramId
  const userRole = req.user!.role?.toUpperCase() || ''
  const userId = req.user!.id

  console.log('🔍 resolveTargetStudentId:', { paramId, targetId, userId, userRole })

  // If accessing own data, allow it (for any role)
  if (targetId === userId) {
    return targetId
  }

  // If accessing someone else's data, only allow COMMITTEE or FACULTY
  if (userRole === 'COMMITTEE' || userRole === 'FACULTY') {
    return targetId
  }

  // Otherwise, deny access
  throw new CustomError('Access denied', 403)
}

const getStudentAssignments = async (studentId: string) => {
  return prisma.assignment.findMany({
    where: { studentId },
    include: {
      section: {
        include: {
          course: true,
          room: true,
          meetings: true,
          instructor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      course: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

// GET /api/students/:id/enrollments
router.get('/:id/enrollments', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const targetId = resolveTargetStudentId(req, req.params.id)
    const assignments = await getStudentAssignments(targetId)

    res.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/students/:id/schedule
router.get('/:id/schedule', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const targetId = resolveTargetStudentId(req, req.params.id)
    const assignments = await getStudentAssignments(targetId)

    res.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    next(error)
  }
})

export { router as studentRoutes }
