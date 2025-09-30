// Check existing data in the database
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking SmartSchedule database data...\n')

  try {
    // Check users
    const users = await prisma.user.findMany()
    console.log(`👥 Users: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`)
    })

    // Check levels
    const levels = await prisma.level.findMany()
    console.log(`\n📊 Levels: ${levels.length}`)
    levels.forEach(level => {
      console.log(`   - ${level.name}`)
    })

    // Check courses
    const courses = await prisma.course.findMany()
    console.log(`\n📚 Courses: ${courses.length}`)
    courses.forEach(course => {
      console.log(`   - ${course.code}: ${course.name} (${course.credits} credits)`)
    })

    // Check schedules
    const schedules = await prisma.schedule.findMany()
    console.log(`\n📅 Schedules: ${schedules.length}`)
    schedules.forEach(schedule => {
      console.log(`   - ${schedule.name} (${schedule.status}) - Version ${schedule.version}`)
    })

    // Check assignments
    const assignments = await prisma.assignment.findMany()
    console.log(`\n📝 Assignments: ${assignments.length}`)
    assignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}`)
    })

    console.log('\n✅ Database check completed!')
    console.log('\n🎯 Your SmartSchedule application is ready to use!')
    console.log('   Open: http://localhost:3000')

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
