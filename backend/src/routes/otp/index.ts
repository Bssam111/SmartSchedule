import { Router } from 'express'
import { z } from 'zod'
import { CustomError } from '@/middleware/errorHandler'
import { prisma } from '@/config/database'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { sendEmail } from '@/utils/email'

const router = Router()

const sendOTPSchema = z.object({
  email: z.string().email('Invalid email address').transform((val) => val.trim().toLowerCase())
})

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address').transform((val) => val.trim().toLowerCase()),
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be 6 digits')
})

const OTP_EXPIRY_MINUTES = 10
const OTP_COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS_PER_HOUR = 5
const OTP_LENGTH = 6

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Hash OTP for storage
 */
async function hashOTP(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

/**
 * Verify OTP against hash
 */
async function verifyOTP(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}

/**
 * POST /api/otp/send
 * Send OTP to email
 */
router.post('/send', async (req, res, next) => {
  try {
    const { email } = sendOTPSchema.parse(req.body)
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Check rate limiting: max 5 attempts per hour
    const recentAttempts = await prisma.emailOTP.count({
      where: {
        email,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

    if (recentAttempts >= MAX_ATTEMPTS_PER_HOUR) {
      throw new CustomError('Too many OTP requests. Please try again later.', 429)
    }

    // Check for recent OTP (cooldown: 60 seconds)
    const recentOTP = await prisma.emailOTP.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(now.getTime() - OTP_COOLDOWN_SECONDS * 1000)
        },
        verified: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (recentOTP) {
      const secondsRemaining = Math.ceil(
        (OTP_COOLDOWN_SECONDS * 1000 - (now.getTime() - recentOTP.createdAt.getTime())) / 1000
      )
      throw new CustomError(
        `Please wait ${secondsRemaining} seconds before requesting a new code.`,
        429
      )
    }

    // Generate OTP
    const code = generateOTP()
    const codeHash = await hashOTP(code)
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Invalidate previous unverified OTPs for this email
    await prisma.emailOTP.updateMany({
      where: {
        email,
        verified: false
      },
      data: {
        verified: true // Mark as "used" by invalidating
      }
    })

    // Store OTP
    await prisma.emailOTP.create({
      data: {
        email,
        codeHash,
        expiresAt,
        attempts: 0,
        verified: false
      }
    })

    // Send email (non-blocking but log result)
    const emailSubject = 'Your SmartSchedule Verification Code'
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .code-box { background-color: #fff; border: 2px solid #2563eb; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center; }
    .code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: monospace; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SmartSchedule</h1>
      <p>Email Verification</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your verification code for SmartSchedule is:</p>
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} SmartSchedule. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `

    // Send email and log the result
    let emailSent = false
    let emailError: any = null
    try {
      emailSent = await sendEmail(email, emailSubject, emailBody)
      if (emailSent) {
        console.info('[OTP] ✅ Email sent successfully to:', email)
      } else {
        console.error('[OTP] ❌ Failed to send email to:', email)
        console.error('[OTP] Check email service configuration and SMTP settings')
        emailError = 'Email service not available'
      }
    } catch (emailErr) {
      emailError = emailErr
      console.error('[OTP] ❌ Exception while sending email:', emailErr)
      // Don't fail the request - OTP is still valid
    }

    // Never log the actual OTP code
    console.info('[OTP] OTP generated and stored for email:', email)

    res.json({
      success: true,
      message: emailSent 
        ? 'Verification code sent to your email'
        : 'Verification code generated, but email delivery failed. Please check backend logs.',
      cooldownSeconds: OTP_COOLDOWN_SECONDS,
      emailSent,
      ...(emailError && { emailWarning: 'Email delivery may have failed. Check spam folder or contact support.' })
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/otp/verify
 * Verify OTP code
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { email, code } = verifyOTPSchema.parse(req.body)
    const now = new Date()

    // Find the most recent unverified OTP for this email
    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        email,
        verified: false,
        expiresAt: {
          gt: now
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!otpRecord) {
      throw new CustomError('Invalid or expired verification code', 400)
    }

    // Check attempts (max 5 per OTP)
    if (otpRecord.attempts >= 5) {
      throw new CustomError('Too many verification attempts. Please request a new code.', 429)
    }

    // Verify code
    const isValid = await verifyOTP(code, otpRecord.codeHash)

    // Increment attempts
    await prisma.emailOTP.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 }
    })

    if (!isValid) {
      throw new CustomError('Invalid verification code', 400)
    }

    // Mark as verified
    await prisma.emailOTP.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    })

    console.info('[OTP] Email verified:', email)

    res.json({
      success: true,
      message: 'Email verified successfully'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/otp/status
 * Check if email is verified (for UI state)
 */
router.get('/status', async (req, res, next) => {
  try {
    const { email } = z.object({
      email: z.string().email().transform((val) => val.trim().toLowerCase())
    }).parse(req.query)

    const verifiedOTP = await prisma.emailOTP.findFirst({
      where: {
        email,
        verified: true,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Verified within last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      verified: !!verifiedOTP
    })
  } catch (error) {
    next(error)
  }
})

export { router as otpRoutes }

