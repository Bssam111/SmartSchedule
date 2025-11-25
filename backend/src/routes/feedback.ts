import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const router = Router()

// Feedback validation schemas
const createFeedbackSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  rating: z.number().int().min(1).max(5).optional(),
})

const updateFeedbackSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
})

// GET /api/feedback - Get all feedback (with user info)
router.get('/', async (req, res, next) => {
  try {
    const { status, userId } = req.query

    const where: any = {}
    
    // Filter by user if provided
    if (userId && typeof userId === 'string') {
      where.userId = userId
    }

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json({
      success: true,
      data: feedback,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/feedback/:id - Get specific feedback
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    if (!feedback) {
      throw new CustomError('Feedback not found', 404)
    }

    res.json({
      success: true,
      data: feedback,
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/feedback - Create new feedback (authenticated)
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401)
    }

    const validationResult = createFeedbackSchema.safeParse(req.body)
    if (!validationResult.success) {
      throw new CustomError(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      )
    }

    const { content, rating } = validationResult.data

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user.id,
        content,
        rating,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully',
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/feedback/:id - Update feedback (authenticated users can update their own, committee can update any)
router.patch('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401)
    }

    const { id } = req.params

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id },
    })

    if (!existingFeedback) {
      throw new CustomError('Feedback not found', 404)
    }

    // Check permissions: user can only update their own feedback, committee can update any
    if (
      existingFeedback.userId !== req.user.id &&
      req.user.role !== 'COMMITTEE'
    ) {
      throw new CustomError('Not authorized to update this feedback', 403)
    }

    const validationResult = updateFeedbackSchema.safeParse(req.body)
    if (!validationResult.success) {
      throw new CustomError(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      )
    }

    const updateData = validationResult.data

    const feedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    res.json({
      success: true,
      data: feedback,
      message: 'Feedback updated successfully',
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/feedback/:id - Delete feedback (authenticated users can delete their own, committee can delete any)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new CustomError('Authentication required', 401)
    }

    const { id } = req.params

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id },
    })

    if (!existingFeedback) {
      throw new CustomError('Feedback not found', 404)
    }

    // Check permissions: user can only delete their own feedback, committee can delete any
    if (
      existingFeedback.userId !== req.user.id &&
      req.user.role !== 'COMMITTEE'
    ) {
      throw new CustomError('Not authorized to delete this feedback', 403)
    }

    await prisma.feedback.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Feedback deleted successfully',
    })
  } catch (error) {
    next(error)
  }
})

export { router as feedbackRoutes }

