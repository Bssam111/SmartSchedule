import { Router } from 'express'
import { prisma } from '@/config/database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'SmartSchedule API'
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Simple healthz endpoint for readiness checks (no DB check)
router.get('/healthz', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

// Cookie test endpoint - helps diagnose cookie issues
router.get('/test-cookies', (req, res) => {
  const cookies = req.cookies || {}
  const cookieKeys = Object.keys(cookies)
  
  res.json({
    success: true,
    cookies: {
      count: cookieKeys.length,
      keys: cookieKeys,
      hasAccessToken: !!cookies.accessToken,
      hasRefreshToken: !!cookies.refreshToken,
      allCookies: cookieKeys.reduce((acc, key) => {
        acc[key] = cookies[key] ? 'present' : 'missing'
        return acc
      }, {} as Record<string, string>)
    },
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: req.headers.cookie ? 'present' : 'missing'
    },
    timestamp: new Date().toISOString()
  })
})

export { router as healthRoutes }




