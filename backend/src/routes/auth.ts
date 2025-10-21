import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '@/config/database'
import { generateTokens, setTokenCookies, clearTokenCookies, verifyToken } from '@/utils/jwt'
import { registerSchema } from '@/utils/validation'
import { z } from 'zod'

// Create a simple login schema directly here for testing
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})
import { CustomError } from '@/middleware/errorHandler'
import { authenticateToken, AuthRequest } from '@/middleware/auth'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role, universityId } = registerSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new CustomError('User with this email already exists', 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        universityId
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

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    console.log('🔍 ==> Login endpoint hit!')
    console.log('🔍 Login request body:', JSON.stringify(req.body))
    console.log('🔍 Login schema shape:', loginSchema.shape)
    console.log('🔍 Login schema keys:', Object.keys(loginSchema.shape))
    
    // Try to parse and catch any errors
    let parsed;
    try {
      parsed = loginSchema.parse(req.body)
      console.log('🔍 Parse successful:', parsed)
    } catch (parseError) {
      console.log('🔍 Parse error:', parseError)
      throw parseError
    }
    
    const { email, password } = parsed

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new CustomError('Invalid credentials', 401)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new CustomError('Invalid credentials', 401)
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken)

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        universityId: user.universityId
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearTokenCookies(res)
  res.json({
    success: true,
    message: 'Logout successful'
  })
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      throw new CustomError('Refresh token required', 401)
    }

    const decoded = verifyToken(refreshToken)
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      throw new CustomError('User not found', 401)
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Set new cookies
    setTokenCookies(res, accessToken, newRefreshToken)

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      user
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
      user
    })
  } catch (error) {
    next(error)
  }
})

export { router as authRoutes }
