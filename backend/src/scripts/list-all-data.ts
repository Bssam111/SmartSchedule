import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📊 Complete Database Contents Report\n')
  console.log('=' .repeat(60))
  
  // Semesters
  console.log('\n📅 SEMESTERS TABLE:')
  console.log('-'.repeat(60))
  const semesters = await prisma.semester.findMany({
    orderBy: [
      { academicYear: 'desc' },
      { semesterNumber: 'desc' }
    ]
  })
  
  if (semesters.length === 0) {
    console.log('   ⚠️  TABLE IS EMPTY')
  } else {
    console.log(`   Total: ${semesters.length} semesters\n`)
    semesters.forEach((sem, idx) => {
      console.log(`   ${idx + 1}. ID: ${sem.id}`)
      console.log(`      Name: ${sem.name}`)
      console.log(`      Academic Year: ${sem.academicYear}`)
      console.log(`      Semester Number: ${sem.semesterNumber}`)
      console.log(`      Is Current: ${sem.isCurrent}`)
      console.log(`      Start Date: ${sem.startDate?.toISOString() || 'N/A'}`)
      console.log(`      End Date: ${sem.endDate?.toISOString() || 'N/A'}`)
      console.log(`      Created: ${sem.createdAt.toISOString()}`)
      console.log('')
    })
  }

  // Registration Windows
  console.log('\n🪟 REGISTRATION_WINDOWS TABLE:')
  console.log('-'.repeat(60))
  const windows = await prisma.registrationWindow.findMany({
    include: {
      semester: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  if (windows.length === 0) {
    console.log('   ⚠️  TABLE IS EMPTY')
  } else {
    console.log(`   Total: ${windows.length} registration windows\n`)
    windows.forEach((win, idx) => {
      console.log(`   ${idx + 1}. ID: ${win.id}`)
      console.log(`      Semester: ${win.semester.name} (${win.semesterId})`)
      console.log(`      Start Date: ${win.startDate.toISOString()}`)
      console.log(`      End Date: ${win.endDate.toISOString()}`)
      console.log(`      Is Open: ${win.isOpen}`)
      console.log(`      Allow Add/Drop: ${win.allowAddDrop}`)
      console.log(`      Max Room Capacity: ${win.maxRoomCapacity}`)
      console.log(`      Max Student Capacity: ${win.maxStudentCapacity}`)
      console.log(`      Created: ${win.createdAt.toISOString()}`)
      console.log('')
    })
  }

  // Database connection info
  console.log('\n🔌 DATABASE CONNECTION:')
  console.log('-'.repeat(60))
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    // Extract just the host and database name
    const match = dbUrl.match(/@([^/]+)\/([^?]+)/)
    if (match) {
      console.log(`   Host: ${match[1]}`)
      console.log(`   Database: ${match[2]}`)
    } else {
      const maskedUrl = dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
      console.log(`   URL: ${maskedUrl}`)
    }
  } else {
    console.log('   ⚠️  DATABASE_URL not set!')
  }

  // Test write
  console.log('\n✍️  WRITE TEST:')
  console.log('-'.repeat(60))
  try {
    const testCount = await prisma.semester.count()
    console.log(`   ✅ Can read: Found ${testCount} semesters`)
    console.log('   ✅ Database connection is working correctly')
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Report complete')
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

