import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Validate DATABASE_URL exists
if (!process.env['DATABASE_URL']) {
  console.warn('⚠️  WARNING: DATABASE_URL environment variable is not set!')
  console.warn('⚠️  Database operations will fail. Please create a .env file with DATABASE_URL.')
}

// Prevent multiple instances of Prisma Client in development
// Clear cached instance if Major model is missing (indicates Prisma Client was regenerated)
let prismaInstance = globalThis.__prisma
if (prismaInstance) {
  // Check if Major model exists in cached instance
  if (!('major' in prismaInstance)) {
    console.log('🔄 Clearing cached Prisma Client (Major model missing)')
    globalThis.__prisma = undefined
    prismaInstance = undefined
  }
}

export const prisma = prismaInstance || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env['DATABASE_URL']
    }
  }
  // Note: Transaction timeouts are configured per-transaction, not globally
  // See approveAccessRequest for transaction-specific timeout configuration
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Database health check
export async function checkDatabaseConnection() {
  if (!process.env['DATABASE_URL']) {
    return { 
      success: false, 
      message: 'DATABASE_URL environment variable is not set',
      timestamp: new Date().toISOString()
    }
  }

  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return { 
      success: true, 
      message: 'Database connected successfully',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    }
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.log('Database disconnected successfully')
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase()
})

process.on('SIGINT', async () => {
  await disconnectDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDatabase()
  process.exit(0)
})
