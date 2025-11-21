import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { requireUserRead } from '@/middleware/rbac'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/users - Get all users (Committee only for detailed view)
router.get('/', authenticateToken, requireUserRead, async (req: AuthRequest, res, next) => {
  try {
    const isCommittee = req.user!.role === 'COMMITTEE'
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        createdAt: true,
        updatedAt: isCommittee,
        _count: isCommittee ? {
          select: {
            authenticators: true
          }
        } : undefined
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Format response with fingerprint count if committee
    const formattedUsers = users.map(user => ({
      ...user,
      fingerprintCount: isCommittee ? (user as any)._count?.authenticators || 0 : undefined,
      _count: undefined // Remove _count from response
    }))

    res.json({
      success: true,
      data: formattedUsers,
      summary: isCommittee ? {
        total: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        faculty: users.filter(u => u.role === 'FACULTY').length,
        committee: users.filter(u => u.role === 'COMMITTEE').length,
        withFingerprints: users.filter((u: any) => u._count?.authenticators > 0).length
      } : undefined
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/users/instructors - Get all faculty members (instructors)
router.get('/instructors', async (req, res, next) => {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      },
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
      data: instructors
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
