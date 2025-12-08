import { PrismaClient } from '@prisma/client'

// Force create a new Prisma Client instance
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function testMajors() {
  try {
    console.log('🔍 Testing if Major model exists in Prisma Client...')
    
    // Try to access the major model
    const hasMajorModel = 'major' in prisma
    console.log(`Major model exists: ${hasMajorModel}`)
    
    if (hasMajorModel) {
      const majors = await prisma.major.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
      })
      console.log(`✅ Found ${majors.length} majors:`)
      majors.forEach(m => console.log(`  - ${m.name}`))
    } else {
      console.error('❌ Major model NOT found in Prisma Client!')
      console.error('Run: npx prisma generate')
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.message?.includes('major') || error.message?.includes('Unknown model')) {
      console.error('The Prisma Client does not have the Major model.')
      console.error('Solution: Run "npx prisma generate" and restart the backend server.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testMajors()

