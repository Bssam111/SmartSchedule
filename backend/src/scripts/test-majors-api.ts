import { prisma } from '../config/database'

async function testMajors() {
  console.log('🔍 Testing majors access from Prisma Client...')
  
  try {
    // Test if Major model exists in Prisma Client
    console.log('Checking if Major model is available...')
    
    const majors = await prisma.major.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true
      }
    })
    
    console.log(`✅ Prisma Client can access majors! Found ${majors.length} majors:`)
    majors.forEach((major) => {
      console.log(`  - ${major.name} (ID: ${major.id})`)
    })
    
    if (majors.length === 0) {
      console.log('⚠️  No majors found in database. Running seed...')
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      try {
        await execAsync('npx tsx -r tsconfig-paths/register src/scripts/seed-committee-and-majors.ts')
        console.log('✅ Seeding completed')
      } catch (error) {
        console.error('❌ Seeding failed:', error)
      }
    }
  } catch (error: any) {
    if (error.message?.includes('Unknown model') || error.message?.includes('major')) {
      console.error('❌ ERROR: Major model not found in Prisma Client!')
      console.error('   This means the Prisma Client needs to be regenerated.')
      console.error('   Run: npx prisma generate')
      console.error('   Then restart the backend server.')
    } else {
      console.error('❌ Error accessing majors:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testMajors()

