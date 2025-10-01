import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'

// GET /api/health/db - Database health check
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Test database connection with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    const duration = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}
