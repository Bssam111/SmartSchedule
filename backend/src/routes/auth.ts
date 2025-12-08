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
    // Normalize universityId - convert empty string to undefined
    if (req.body.universityId === '') {
      req.body.universityId = undefined
    }
    
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

    console.log('🔍 Looking for user with email:', email)

    // Find user with major and registration semester
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        registrationSemester: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            semesterNumber: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found:', email)
      throw new CustomError('Invalid credentials', 401)
    }

    console.log('✅ User found:', user.email, 'Role:', user.role)
    console.log('🔍 Verifying password...')
    console.log('🔍 Password hash in DB:', user.password.substring(0, 30) + '...')

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log('🔍 Password match:', isValidPassword)
    
    if (!isValidPassword) {
      console.log('❌ Password verification failed for:', email)
      throw new CustomError('Invalid credentials', 401)
    }

    console.log('✅ Password verified successfully')

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    // Set cookies
    console.log('[Login] 🔐 Setting cookies for user:', user.email)
    console.log('[Login] 🔐 Request origin:', req.headers.origin)
    console.log('[Login] 🔐 Request headers:', {
      origin: req.headers.origin,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    })
    setTokenCookies(res, accessToken, refreshToken)
    
    // Log cookie headers that were set
    const setCookieHeaders = res.getHeader('Set-Cookie')
    console.log('[Login] 🔐 Set-Cookie headers:', setCookieHeaders)
    console.log('[Login] 🔐 Response headers:', {
      'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials'),
      'Set-Cookie': setCookieHeaders ? (Array.isArray(setCookieHeaders) ? setCookieHeaders.length : 1) + ' cookie(s)' : 'none'
    })

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        universityId: user.universityId,
        requiresPasswordChange: user.requiresPasswordChange,
        major: user.major ? {
          id: user.major.id,
          name: user.major.name,
          code: user.major.code
        } : null,
        registrationSemester: user.registrationSemester ? {
          id: user.registrationSemester.id,
          name: user.registrationSemester.name,
          academicYear: user.registrationSemester.academicYear,
          semesterNumber: user.registrationSemester.semesterNumber
        } : null
      },
      requiresPasswordChange: user.requiresPasswordChange,
      requiresPasswordReset: user.requiresPasswordChange, // Alias for frontend compatibility
      // Also return token in response for frontend to store (as backup to cookies)
      token: accessToken
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Login successful for:', user.email, 'Role:', user.role)
    }
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
      user,
      token: accessToken // Return new token for client-side storage
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
        requiresPasswordChange: true,
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

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { passwordChangeSchema } = await import('@/utils/validation')
    const { validatePassword } = await import('@/utils/password-validation')
    
    // Parse basic structure first
    const parsed = passwordChangeSchema.parse(req.body)
    const { currentPassword, newPassword, confirmPassword } = parsed

    // Check password match
    if (newPassword !== (confirmPassword || newPassword)) {
      throw new CustomError('Passwords do not match', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        password: true,
        requiresPasswordChange: true
      }
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    // Verify current password (unless it's a forced change)
    if (!user.requiresPasswordChange) {
      if (!currentPassword) {
        throw new CustomError('Current password is required', 400)
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        throw new CustomError('Current password is incorrect', 400)
      }
    }

    // Validate new password against dynamic requirements (this is the actual validation)
    const validation = await validatePassword(newPassword)
    if (!validation.isValid) {
      // Return user-friendly error message
      const errorMessage = validation.errors.join('. ')
      throw new CustomError(errorMessage, 400)
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and clear requiresPasswordChange flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        requiresPasswordChange: false
      }
    })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/forgot-password
// This endpoint just triggers OTP sending - the actual OTP is sent via /api/otp/send
// We keep this for API consistency, but the frontend should call /api/otp/send directly
router.post('/forgot-password', async (req, res, next) => {
  try {
    z.object({
      email: z.string().email('Invalid email address').transform((val) => val.trim().toLowerCase())
    }).parse(req.body)

    // Always return success (security best practice - don't reveal if email exists)
    // The OTP endpoint will handle the actual sending
    res.json({
      success: true,
      message: 'If an account with that email exists, a verification code has been sent.'
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, code, newPassword } = z.object({
      email: z.string().email('Invalid email address').transform((val) => val.trim().toLowerCase()),
      code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits'),
      newPassword: z.string().min(1, 'Password is required')
    }).parse(req.body)

    // Verify OTP first
    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!otpRecord) {
      throw new CustomError('Invalid or expired verification code', 400)
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      throw new CustomError('Too many verification attempts. Please request a new code.', 429)
    }

    // Verify code
    const isValid = await bcrypt.compare(code, otpRecord.codeHash)
    
    // Increment attempts
    await prisma.emailOTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    })
    
    if (!isValid) {
      throw new CustomError('Invalid verification code', 400)
    }

    // Mark OTP as verified
    await prisma.emailOTP.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    })

    // Validate password
    const { validatePassword } = await import('@/utils/password-validation')
    const validation = await validatePassword(newPassword)
    if (!validation.isValid) {
      throw new CustomError(validation.errors.join('. '), 400)
    }

    // Find user and update password
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new CustomError('User not found', 404)
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        requiresPasswordChange: false
      }
    })

    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    next(error)
  }
})

export { router as authRoutes }
