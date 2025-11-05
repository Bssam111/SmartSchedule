import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, requireFacultyOrCommittee, AuthRequest } from '@/middleware/auth'

const router = Router()

// GET /api/conflicts
router.get('/', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    // Mock conflicts - in a real app, this would detect actual scheduling conflicts
    const conflicts = [
      {
        id: '1',
        type: 'room_double_booking',
        title: 'Room Double Booking',
        description: 'Room A101 is scheduled for two sections at the same time',
        severity: 'high',
        affectedSections: ['section1', 'section2'],
        createdAt: new Date()
      },
      {
        id: '2',
        type: 'instructor_overload',
        title: 'Instructor Overload',
        description: 'Dr. Smith is scheduled for too many consecutive hours',
        severity: 'medium',
        affectedSections: ['section3', 'section4'],
        createdAt: new Date()
      }
    ]

    res.json({
      success: true,
      data: conflicts
    })
  } catch (error) {
    next(error)
  }
})

export { router as conflictRoutes }
