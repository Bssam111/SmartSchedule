import { Router } from 'express'
import { prisma } from '@/config/database'
import { generateTimeSlots } from '@/utils/validation'
import { authenticateToken, requireFacultyOrCommittee, AuthRequest } from '@/middleware/auth'

const router = Router()

// GET /api/timeslots
router.get('/', async (req, res, next) => {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        startTime: {
          gte: '08:00'
        },
        endTime: {
          lte: '20:00'
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    res.json({
      success: true,
      data: timeSlots
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/timeslots/generate
router.post('/generate', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    // Clear existing time slots
    await prisma.timeSlot.deleteMany({})

    // Generate new time slots
    const timeSlots = generateTimeSlots()

    // Create time slots in database
    const createdTimeSlots = await prisma.timeSlot.createMany({
      data: timeSlots
    })

    res.json({
      success: true,
      message: `Generated ${createdTimeSlots.count} time slots`,
      data: timeSlots
    })
  } catch (error) {
    next(error)
  }
})

export { router as timeslotRoutes }
