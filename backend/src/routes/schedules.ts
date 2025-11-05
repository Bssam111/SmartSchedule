import { Router } from 'express'
import { prisma } from '@/config/database'
import { createScheduleSchema, updateScheduleSchema } from '@/utils/validation'
import { authenticateToken, requireCommittee, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/schedules
router.get('/', async (req, res, next) => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        statusRef: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: schedules
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/schedules/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        statusRef: true
      }
    })

    if (!schedule) {
      throw new CustomError('Schedule not found', 404)
    }

    res.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/schedules
router.post('/', authenticateToken, requireCommittee, async (req: AuthRequest, res, next) => {
  try {
    const scheduleData = createScheduleSchema.parse(req.body)

    const schedule = await prisma.schedule.create({
      data: {
        name: scheduleData.name,
        status: scheduleData.status || 'DRAFT'
      },
      include: {
        statusRef: true
      }
    })

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/schedules/:id
router.put('/:id', authenticateToken, requireCommittee, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const scheduleData = updateScheduleSchema.parse(req.body)

    const schedule = await prisma.schedule.update({
      where: { id },
      data: scheduleData,
      include: {
        statusRef: true
      }
    })

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule
    })
  } catch (error) {
    next(error)
  }
})

export { router as scheduleRoutes }
