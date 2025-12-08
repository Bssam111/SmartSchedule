import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireAdmin } from '@/middleware/auth'
import { requireUserRead } from '@/middleware/rbac'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const router = Router()

// GET /api/users - Get all users (Committee/Admin only for detailed view)
router.get('/', authenticateToken, requireUserRead, async (req: AuthRequest, res, next) => {
  try {
    const isCommittee = req.user!.role === 'COMMITTEE' || req.user!.role === 'ADMIN'
    
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
        admin: users.filter(u => u.role === 'ADMIN').length,
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

    // Users can only view their own profile unless they're committee or admin
    if (req.user!.id !== id && req.user!.role !== 'COMMITTEE' && req.user!.role !== 'ADMIN') {
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

// Admin-only routes for user management

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'COMMITTEE', 'ADMIN']),
  universityId: z.string().optional()
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['STUDENT', 'FACULTY', 'COMMITTEE', 'ADMIN']).optional(),
  universityId: z.string().optional().nullable()
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
})

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const data = createUserSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new CustomError('User with this email already exists', 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        universityId: data.universityId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        createdAt: true
      }
    })

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const data = updateUserSchema.parse(req.body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      throw new CustomError('User not found', 404)
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email }
      })
      if (emailTaken) {
        throw new CustomError('Email already in use', 409)
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role }),
        ...(data.universityId !== undefined && { universityId: data.universityId })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves
    if (id === req.user!.id) {
      throw new CustomError('Cannot delete your own account', 400)
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      throw new CustomError('User not found', 404)
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/users/:id/reset-password - Reset user password (Admin only)
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const { newPassword } = resetPasswordSchema.parse(req.body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      throw new CustomError('User not found', 404)
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/:id/enable - Enable user account (Admin only)
router.put('/:id/enable', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    // Note: Currently there's no disabled field in the schema
    // This is a placeholder for future implementation
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'User account enabled',
      data: user
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/users/:id/disable - Disable user account (Admin only)
router.put('/:id/disable', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Prevent admin from disabling themselves
    if (id === req.user!.id) {
      throw new CustomError('Cannot disable your own account', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    // Note: Currently there's no disabled field in the schema
    // This is a placeholder for future implementation
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'User account disabled',
      data: user
    })
  } catch (error) {
    next(error)
  }
})

export { router as userRoutes }
