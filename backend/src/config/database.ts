import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Prevent multiple instances of Prisma Client in development
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

// Database health check
export async function checkDatabaseConnection() {
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
