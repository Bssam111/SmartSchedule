import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/rooms - Get all rooms
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    res.json({
      success: true,
      data: rooms
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/rooms/:id - Get room by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    const room = await prisma.room.findUnique({
      where: { id }
    })

    if (!room) {
      throw new CustomError('Room not found', 404)
    }

    res.json({
      success: true,
      data: room
    })
  } catch (error) {
    next(error)
  }
})

export { router as roomRoutes }


