import { beforeAll, afterAll, beforeEach } from 'vitest'
import { prisma } from '@/config/database'

beforeAll(async () => {
  // Setup test database connection
  await prisma.$connect()
})

afterAll(async () => {
  // Cleanup test database connection
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up test data before each test
  await prisma.assignment.deleteMany()
  await prisma.section.deleteMany()
  await prisma.course.deleteMany()
  await prisma.room.deleteMany()
  await prisma.user.deleteMany()
  await prisma.level.deleteMany()
  await prisma.timeSlot.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.scheduleStatus.deleteMany()
})
