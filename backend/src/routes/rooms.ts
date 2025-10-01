import { Router } from 'express'
import { prisma } from '@/config/database'
import { createRoomSchema, updateRoomSchema } from '@/utils/validation'
import { authenticateToken, requireFacultyOrCommittee, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/rooms
router.get('/', async (req, res, next) => {
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

// GET /api/rooms/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            course: true,
            instructor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
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

// POST /api/rooms
router.post('/', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const roomData = createRoomSchema.parse(req.body)

    // Check if room name already exists
    const existingRoom = await prisma.room.findUnique({
      where: { name: roomData.name }
    })

    if (existingRoom) {
      throw new CustomError('Room with this name already exists', 409)
    }

    const room = await prisma.room.create({
      data: roomData
    })

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/rooms/:id
router.put('/:id', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const roomData = updateRoomSchema.parse(req.body)

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id }
    })

    if (!existingRoom) {
      throw new CustomError('Room not found', 404)
    }

    // Check if new name conflicts with existing room
    if (roomData.name && roomData.name !== existingRoom.name) {
      const nameConflict = await prisma.room.findUnique({
        where: { name: roomData.name }
      })

      if (nameConflict) {
        throw new CustomError('Room with this name already exists', 409)
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: roomData
    })

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: room
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/rooms/:id
router.delete('/:id', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        sections: true
      }
    })

    if (!room) {
      throw new CustomError('Room not found', 404)
    }

    // Check if room has sections
    if (room.sections.length > 0) {
      throw new CustomError('Cannot delete room with existing sections', 400)
    }

    await prisma.room.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Room deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

export { router as roomRoutes }
