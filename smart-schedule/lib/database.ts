// Database connection and utilities for the frontend
import { PrismaClient } from '@prisma/client'

// This would typically be used on the server-side only
// For client-side, we use the API endpoints instead
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Database health check
export async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return { success: true, message: 'Database connected successfully' }
  } catch (error) {
    console.error('Database connection failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown database error' 
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
