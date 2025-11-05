import { Router } from 'express'
import { checkDatabaseConnection } from '@/config/database'

const router = Router()

// GET /api/health
router.get('/', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection()
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy'
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /api/health/db
router.get('/db', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection()
    
    if (dbStatus.success) {
      res.json({
        success: true,
        ...dbStatus
      })
    } else {
      res.status(500).json({
        success: false,
        ...dbStatus
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Database health check failed',
      timestamp: new Date().toISOString()
    })
  }
})

export { router as healthRoutes }
