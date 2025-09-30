const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function backfillUniversityIds() {
  try {
    console.log('Starting universityId backfill...')
    
    // Get all students without universityId
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        universityId: null
      }
    })
    
    console.log(`Found ${students.length} students without universityId`)
    
    // Generate universityId for each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      const universityId = `STU${String(i + 1).padStart(6, '0')}` // STU000001, STU000002, etc.
      
      await prisma.user.update({
        where: { id: student.id },
        data: { universityId }
      })
      
      console.log(`Updated ${student.name} with universityId: ${universityId}`)
    }
    
    console.log('UniversityId backfill completed successfully!')
  } catch (error) {
    console.error('Error during universityId backfill:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the backfill
backfillUniversityIds()
  .then(() => {
    console.log('Migration completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
