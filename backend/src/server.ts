import 'express-async-errors'
import express from 'express'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { createServer, Server } from 'node:http'

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
import { accessRequestRoutes } from '@/routes/access-requests'
import { otpRoutes } from '@/routes/otp'
import { majorsRoutes } from '@/routes/majors'
import { semesterRoutes } from '@/routes/semesters'
import { planRoutes } from '@/routes/plans'
import { enrollmentRoutes } from '@/routes/enrollment'
import { gradeRoutes } from '@/routes/grades'
import { passwordRequirementsRoutes } from '@/routes/password-requirements'
import courseFacultyRoutes from '@/routes/course-faculty'
import { startServerWithPortFallback } from '@/utils/port'

// Load environment variables
dotenv.config()

const app = express()
const desiredPort = Number.parseInt(process.env['PORT'] || '3001', 10)
let httpServer: Server | null = null

// Health check endpoint (before all middleware for quick readiness checks)
// Add CORS headers manually since this endpoint is before CORS middleware
app.get('/healthz', (req, res) => {
  const origin = req.headers.origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3000']
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhostOrigin = origin ? /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin) : false
  
  if (origin && (allowedOrigins.includes(origin) || (isDev && isLocalhostOrigin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (!origin && isDev) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || 'http://localhost:3000')
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Handle OPTIONS request for /healthz (CORS preflight)
app.options('/healthz', (req, res) => {
  const origin = req.headers.origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || ['http://localhost:3000']
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhostOrigin = origin ? /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin) : false
  
  if (origin && (allowedOrigins.includes(origin) || (isDev && isLocalhostOrigin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (!origin && isDev) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || 'http://localhost:3000')
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
  res.status(200).end()
})

// Enhanced security middleware
app.use(securityHeaders)
app.use(strictCors)
app.use(securityLogger)
app.use(requestSizeLimit('10mb'))
app.use(sanitizeInput)
app.use(fileUploadSecurity)

// Rate limiting for different endpoint types
// DISABLED: Rate limiting temporarily disabled for development
// app.use('/api/auth', authRateLimit)
// app.use('/api/users', strictApiRateLimit)
// app.use('/api/otp', authRateLimit) // OTP endpoints need strict rate limiting
// app.use('/api', apiRateLimit)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Compression middleware
app.use(compression())

// Health check endpoint (with DB check)
app.use('/api/health', healthRoutes)

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'SmartSchedule API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      healthz: '/healthz',
      auth: '/api/auth',
      sections: '/api/sections',
      users: '/api/users',
      faculty: '/api/faculty',
      students: '/api/students',
      analytics: '/api/analytics',
      feedback: '/api/feedback',
      courses: '/api/courses',
      rooms: '/api/rooms',
      timeslots: '/api/timeslots',
      accessRequests: '/api/access-requests'
    },
    documentation: 'See README.md for API documentation'
  })
})

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
app.use('/api/access-requests', accessRequestRoutes)
app.use('/api/otp', otpRoutes)
app.use('/api/majors', majorsRoutes)
app.use('/api/semesters', semesterRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/enrollment', enrollmentRoutes)
app.use('/api/grades', gradeRoutes)
app.use('/api/password-requirements', passwordRequirementsRoutes)
app.use('/api/course-faculty', courseFacultyRoutes)

// 404 handler
app.use(notFoundHandler)

// Error handling middleware (must be last)
app.use(errorHandler)

// Graceful shutdown handler
function gracefulShutdown(signal: string) {
  return () => {
    console.log(`\n${signal} received, shutting down gracefully...`)
    
    if (httpServer) {
      httpServer.close(() => {
        console.log('✅ HTTP server closed')
        process.exit(0)
      })
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout')
        process.exit(1)
      }, 10000)
    } else {
      process.exit(0)
    }
  }
}

// Register shutdown handlers
process.on('SIGTERM', gracefulShutdown('SIGTERM'))
process.on('SIGINT', gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  if (httpServer) {
    httpServer.close(() => process.exit(1))
  } else {
    process.exit(1)
  }
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  // Don't exit, just log
})

// Prevent multiple server instances
let serverStarting = false
let serverStarted = false

// Only start server if this is the main module (not imported) and not already started
// In Docker, always start; in local dev, check require.main
const isDocker = process.env.DOCKER_ENV === 'true'
const isMainModule = require.main === module
const isDev = process.env.NODE_ENV === 'development'

const shouldStart = !serverStarted && !serverStarting && (isDocker || isMainModule || isDev)

if (shouldStart) {
  serverStarting = true
  
  httpServer = createServer(app)
  
  // Determine host - 0.0.0.0 for Docker, localhost for local dev
  const host = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENV === 'true' 
    ? '0.0.0.0' 
    : 'localhost'
  
  startServerWithPortFallback(httpServer, desiredPort, host, (actualPort) => {
    serverStarted = true
    serverStarting = false
    
    const baseUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${actualPort}`
    const apiUrl = `${baseUrl}/api`
    
    console.log(`🚀 Server running on ${host}:${actualPort}`)
    if (host === '0.0.0.0') {
      console.log(`✅ Listening on 0.0.0.0:${actualPort} (accessible from host)`)
    }
    console.log(`📡 API URL: ${apiUrl}`)
    console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`)
    console.log(`🌐 CORS enabled for: ${process.env['FRONTEND_URL'] || 'http://localhost:3000'}`)
    
    // Log port change if different from desired
    if (actualPort !== desiredPort) {
      console.log(`⚠️  Note: Using port ${actualPort} instead of ${desiredPort}`)
      console.log(`⚠️  Update FRONTEND_URL or NEXT_PUBLIC_API_URL to: ${apiUrl}`)
    }
    
    // Check database connection status
    if (process.env['DATABASE_URL']) {
      console.log('✅ DATABASE_URL configured')
    } else {
      console.warn('⚠️  WARNING: DATABASE_URL not set. Database operations will fail.')
    }
    
    // Export the actual port for potential use by other modules
    process.env['ACTUAL_PORT'] = actualPort.toString()
    process.env['ACTUAL_API_URL'] = apiUrl
    
    // Start WebSocket server for real-time collaboration (after HTTP server starts)
    if (process.env.NODE_ENV !== 'test') {
      // Delay WebSocket server start to ensure HTTP server is ready
      setTimeout(() => {
        import('./websocket/server')
          .then(({ createWebSocketServer }) => {
            createWebSocketServer()
          })
          .catch((error) => {
            console.warn('⚠️  WebSocket server not started:', error)
          })
      }, 1000)
    }
  }).catch((error) => {
    serverStarting = false
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  })
}

export default app
