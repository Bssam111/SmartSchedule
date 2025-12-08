import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking database contents...\n')

  try {
    // Check semesters
    console.log('📅 Checking semesters table...')
    const semesters = await prisma.semester.findMany({
      orderBy: [
        { academicYear: 'desc' },
        { semesterNumber: 'desc' }
      ]
    })
    console.log(`   Found ${semesters.length} semesters:`)
    if (semesters.length === 0) {
      console.log('   ⚠️  No semesters found in database!')
    } else {
      semesters.forEach(sem => {
        console.log(`   - ${sem.name} (${sem.academicYear} S${sem.semesterNumber}) [Current: ${sem.isCurrent}]`)
      })
    }

    // Check registration windows
    console.log('\n🪟 Checking registration_windows table...')
    const windows = await prisma.registrationWindow.findMany({
      include: {
        semester: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log(`   Found ${windows.length} registration windows:`)
    if (windows.length === 0) {
      console.log('   ⚠️  No registration windows found in database!')
    } else {
      windows.forEach(win => {
        console.log(`   - ${win.semester.name} [Open: ${win.isOpen}] (${win.startDate.toISOString()} to ${win.endDate.toISOString()})`)
      })
    }

    // Check database connection
    console.log('\n🔌 Testing database connection...')
    await prisma.$queryRaw`SELECT 1`
    console.log('   ✅ Database connection is working')

    // Check if we can write
    console.log('\n✍️  Testing write capability...')
    const testSemester = await prisma.semester.findFirst()
    if (testSemester) {
      console.log(`   ✅ Can read from database (found semester: ${testSemester.name})`)
    } else {
      console.log('   ⚠️  Database is readable but empty')
    }

    // Check Prisma client connection
    console.log('\n📊 Database URL info:')
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      // Mask password in URL
      const maskedUrl = dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
      console.log(`   Database: ${maskedUrl.split('@')[1] || 'Unknown'}`)
    } else {
      console.log('   ⚠️  DATABASE_URL not set!')
    }

  } catch (error) {
    console.error('❌ Error checking database:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

