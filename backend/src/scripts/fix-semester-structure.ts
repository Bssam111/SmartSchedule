import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Checking and fixing semester structure...')

  try {
    // Check if there are any semesters with the old structure
    const allSemesters = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'semesters'
    ` as Array<{ column_name: string }>

    const columns = allSemesters.map(c => c.column_name)
    console.log('📊 Current semester table columns:', columns)

    // Check if old 'number' column exists
    const hasOldNumber = columns.includes('number')
    const hasAcademicYear = columns.includes('academicYear')
    const hasSemesterNumber = columns.includes('semesterNumber')

    if (hasOldNumber && !hasAcademicYear) {
      console.log('⚠️  Old semester structure detected. Need to migrate data.')
      console.log('   This requires a manual migration. Please run:')
      console.log('   npx prisma migrate dev --name update_semester_structure')
      return
    }

    if (!hasAcademicYear || !hasSemesterNumber) {
      console.log('❌ Semester table is missing required columns.')
      console.log('   Please run: npx prisma db push')
      return
    }

    // Check if there are any semesters in the database
    const semesterCount = await prisma.semester.count()
    console.log(`✅ Semester table structure is correct. Found ${semesterCount} semesters.`)

    if (semesterCount === 0) {
      console.log('ℹ️  No semesters found. Run seed-mock-data.ts to create semesters.')
    } else {
      // List all semesters
      const semesters = await prisma.semester.findMany({
        select: {
          id: true,
          academicYear: true,
          semesterNumber: true,
          name: true,
          isCurrent: true
        }
      })
      console.log('\n📅 Existing semesters:')
      semesters.forEach(s => {
        console.log(`   - ${s.name} (${s.academicYear} S${s.semesterNumber}) ${s.isCurrent ? '[CURRENT]' : ''}`)
      })
    }

  } catch (error: any) {
    console.error('❌ Error checking semester structure:', error.message)
    
    // If the error is about missing columns, suggest migration
    if (error.message?.includes('academicYear') || error.message?.includes('Unknown column')) {
      console.log('\n💡 The database schema needs to be updated.')
      console.log('   Run: npx prisma migrate dev --name update_semester_structure')
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

