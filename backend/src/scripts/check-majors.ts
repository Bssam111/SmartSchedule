import { prisma } from '../config/database'

async function checkMajors() {
  console.log('🔍 Checking majors in database...')
  
  try {
    const majors = await prisma.major.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`✅ Found ${majors.length} majors:`)
    majors.forEach((major) => {
      console.log(`  - ${major.name} (ID: ${major.id})`)
    })
    
    if (majors.length === 0) {
      console.log('⚠️  No majors found! Running seed script...')
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
  } catch (error) {
    console.error('❌ Error checking majors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMajors()

