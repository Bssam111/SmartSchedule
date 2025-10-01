import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, requireCommittee, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/users
router.get('/', authenticateToken, requireCommittee, async (req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/users/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Users can only view their own profile unless they're committee
    if (req.user!.id !== id && req.user!.role !== 'COMMITTEE') {
      throw new CustomError('Access denied', 403)
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        createdAt: true
      }
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
})

export { router as userRoutes }
