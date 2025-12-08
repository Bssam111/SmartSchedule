import { Router } from 'express'
import { prisma } from '@/config/database'

const router = Router()

/**
 * GET /api/majors
 * List all majors
 */
router.get('/', async (_req, res, next) => {
  try {
    console.log('[Majors] Fetching majors from database...')
    console.log('[Majors] Prisma Client type:', typeof prisma)
    console.log('[Majors] Major model exists:', 'major' in prisma)
    
    // Check if Major model exists in Prisma Client
    if (!('major' in prisma)) {
      console.error('[Majors] ERROR: Major model not found in Prisma Client!')
      console.error('[Majors] Available models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')))
      console.error('[Majors] The backend server needs to be restarted after running: npx prisma generate')
      return res.status(500).json({
        success: false,
        error: 'Major model not available. Please restart the backend server.',
        hint: 'Run: npx prisma generate (if not done) then restart the backend server'
      })
    }
    
    const majors = await prisma.major.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true
      }
    })

    console.log(`[Majors] Found ${majors.length} majors:`, majors.map(m => m.name).join(', '))

    res.json({
      success: true,
      data: majors
    })
  } catch (error: any) {
    console.error('[Majors] Error fetching majors:', error)
    console.error('[Majors] Error message:', error.message)
    console.error('[Majors] Error stack:', error.stack)
    
    // Check if it's a "model not found" error
    if (error.message?.includes('Unknown model') || 
        error.message?.includes('major') ||
        error.message?.includes('does not exist')) {
      console.error('[Majors] Prisma Client does not have Major model. Restart backend server!')
      return res.status(500).json({
        success: false,
        error: 'Major model not available. Please restart the backend server after running: npx prisma generate',
        details: error.message
      })
    }
    
    next(error)
  }
})

export { router as majorsRoutes }

