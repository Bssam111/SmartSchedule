import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, requireStudent, AuthRequest } from '@/middleware/auth'
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
    const { q } = req.query

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

export { router as studentRoutes }
