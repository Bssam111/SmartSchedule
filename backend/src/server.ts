import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { errorHandler } from '@/middleware/errorHandler'
import { notFoundHandler } from '@/middleware/notFoundHandler'
import { 
  securityHeaders, 
  strictCors, 
  apiRateLimit, 
  authRateLimit, 
  strictApiRateLimit,
  requestSizeLimit,
  sanitizeInput,
  fileUploadSecurity,
  securityLogger
} from '@/middleware/security'
import { authRoutes } from '@/routes/auth'
import { courseRoutes } from '@/routes/courses'
import { sectionRoutes } from '@/routes/sections'
import { scheduleRoutes } from '@/routes/schedules'
import { userRoutes } from '@/routes/users'
import { roomRoutes } from '@/routes/rooms'
import { timeslotRoutes } from '@/routes/timeslots'
import { healthRoutes } from '@/routes/health'
import { recommendationRoutes } from '@/routes/recommendations'
import { conflictRoutes } from '@/routes/conflicts'
import { generateRoutes } from '@/routes/generate'
import { facultyRoutes } from '@/routes/faculty'
import { studentRoutes } from '@/routes/students'
import { enrollRoutes } from '@/routes/enroll'
import { rbacTestRoutes } from '@/routes/rbac-test'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Enhanced security middleware
app.use(securityHeaders)
app.use(strictCors)
app.use(securityLogger)
app.use(requestSizeLimit('10mb'))
app.use(sanitizeInput)
app.use(fileUploadSecurity)

// Rate limiting for different endpoint types
app.use('/api/auth', authRateLimit)
app.use('/api/users', strictApiRateLimit)
app.use('/api/schedules', strictApiRateLimit)
app.use('/api', apiRateLimit)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Compression middleware
app.use(compression())

// Health check endpoint (before rate limiting)
app.use('/api/health', healthRoutes)

// Test validation endpoint (temporary)
import { testValidationRoutes } from '@/routes/test-validation'
app.use('/api/test', testValidationRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/sections', sectionRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/users', userRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/timeslots', timeslotRoutes)
app.use('/api/recommendations', recommendationRoutes)
app.use('/api/conflicts', conflictRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/enroll', enrollRoutes)
app.use('/api/rbac-test', rbacTestRoutes)

// 404 handler
app.use(notFoundHandler)

// Error handling middleware (must be last)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})

export default app
