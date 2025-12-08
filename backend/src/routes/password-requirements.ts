import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireAdmin } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const router = Router()

const updatePasswordRequirementSchema = z.object({
  minLength: z.number().int().min(4).max(32),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean()
})

/**
 * GET /api/password-requirements
 * Get current password requirements
 */
router.get('/', authenticateToken, async (_req: AuthRequest, res, next) => {
  try {
    let requirements = await prisma.passwordRequirement.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    // If no requirements exist, create default
    if (!requirements) {
      requirements = await prisma.passwordRequirement.create({
        data: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        }
      })
    }

    res.json({
      success: true,
      data: requirements
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/password-requirements
 * Update password requirements (Admin only)
 */
router.put('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = updatePasswordRequirementSchema.parse(req.body)

    // Get or create requirements
    let requirements = await prisma.passwordRequirement.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    if (requirements) {
      // Update existing
      requirements = await prisma.passwordRequirement.update({
        where: { id: requirements.id },
        data: {
          ...data,
          updatedBy: req.user!.id
        }
      })
    } else {
      // Create new
      requirements = await prisma.passwordRequirement.create({
        data: {
          ...data,
          updatedBy: req.user!.id
        }
      })
    }

    res.json({
      success: true,
      message: 'Password requirements updated successfully',
      data: requirements
    })
  } catch (error) {
    next(error)
  }
})

export { router as passwordRequirementsRoutes }

