import 'express-async-errors'
import express from 'express'
import compression from 'compression'
import cookieParser from 'cookie-parser'
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
import { sectionRoutes } from '@/routes/sections'
import { userRoutes } from '@/routes/users'
import { healthRoutes } from '@/routes/health'
import { recommendationRoutes } from '@/routes/recommendations'
import { facultyRoutes } from '@/routes/faculty'
import { studentRoutes } from '@/routes/students'
import { webauthnRoutes } from '@/routes/webauthn'
import { analyticsRoutes } from '@/routes/analytics'
import { versionControlRoutes } from '@/routes/version-control'
import { feedbackRoutes } from '@/routes/feedback'
import { courseRoutes } from '@/routes/courses'
import { roomRoutes } from '@/routes/rooms'
import { timeslotRoutes } from '@/routes/timeslots'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env['PORT'] || 3001

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
app.use('/api', apiRateLimit)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Compression middleware
app.use(compression())

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'SmartSchedule API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      sections: '/api/sections',
      users: '/api/users',
      faculty: '/api/faculty',
      students: '/api/students',
      analytics: '/api/analytics',
      feedback: '/api/feedback',
      courses: '/api/courses',
      rooms: '/api/rooms',
      timeslots: '/api/timeslots'
    },
    documentation: 'See README.md for API documentation'
  })
})

// Health check endpoint (before rate limiting)
app.use('/api/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/sections', sectionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/recommendations', recommendationRoutes)
app.use('/api/faculty', facultyRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/webauthn', webauthnRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/versions', versionControlRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/timeslots', timeslotRoutes)

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

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`)
  console.log(`🌐 CORS enabled for: ${process.env['FRONTEND_URL'] || 'http://localhost:3000'}`)
  
  // Check database connection status
  if (!process.env['DATABASE_URL']) {
    console.warn('⚠️  WARNING: DATABASE_URL not set. Database operations will fail.')
  } else {
    console.log('✅ DATABASE_URL configured')
  }
})

// Start WebSocket server for real-time collaboration
if (process.env.NODE_ENV !== 'test') {
  try {
    import('./websocket/server').then(({ createWebSocketServer }) => {
    createWebSocketServer()
    }).catch((error) => {
      console.warn('⚠️  WebSocket server not started:', error)
    })
  } catch (error) {
    console.warn('⚠️  WebSocket server not started:', error)
  }
}

export default app
