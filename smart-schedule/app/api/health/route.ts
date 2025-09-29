import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseHealth()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'healthy'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function checkDatabaseHealth() {
  try {
    // In a real implementation, you would check the database connection
    // For now, return a mock status
    return {
      status: 'connected',
      responseTime: '5ms'
    }
  } catch (error) {
    return {
      status: 'disconnected',
      error: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}
