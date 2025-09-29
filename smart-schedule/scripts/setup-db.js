// Database setup script for SmartSchedule
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up SmartSchedule database...')

  try {
    // Create sample data
    console.log('📊 Creating sample levels...')
    const level1 = await prisma.level.create({
      data: {
        name: 'Freshman',
      },
    })

    const level2 = await prisma.level.create({
      data: {
        name: 'Sophomore',
      },
    })

    const level3 = await prisma.level.create({
      data: {
        name: 'Junior',
      },
    })

    const level4 = await prisma.level.create({
      data: {
        name: 'Senior',
      },
    })

    console.log('👥 Creating sample users...')
    const student = await prisma.user.create({
      data: {
        email: 'student@university.edu',
        name: 'John Student',
        role: 'STUDENT',
      },
    })

    const faculty = await prisma.user.create({
      data: {
        email: 'faculty@university.edu',
        name: 'Dr. Smith',
        role: 'FACULTY',
      },
    })

    const committee = await prisma.user.create({
      data: {
        email: 'committee@university.edu',
        name: 'Scheduling Committee',
        role: 'COMMITTEE',
      },
    })

    console.log('📚 Creating sample courses...')
    const course1 = await prisma.course.create({
      data: {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        levelId: level1.id,
      },
    })

    const course2 = await prisma.course.create({
      data: {
        code: 'CS201',
        name: 'Data Structures',
        credits: 3,
        levelId: level2.id,
      },
    })

    console.log('🏫 Creating sample rooms...')
    const room1 = await prisma.room.create({
      data: {
        name: 'Room 101',
        capacity: 30,
      },
    })

    const room2 = await prisma.room.create({
      data: {
        name: 'Room 102',
        capacity: 25,
      },
    })

    console.log('⏰ Creating sample time slots...')
    const timeSlot1 = await prisma.timeSlot.create({
      data: {
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
      },
    })

    const timeSlot2 = await prisma.timeSlot.create({
      data: {
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '10:30',
      },
    })

    console.log('📖 Creating sample sections...')
    const section1 = await prisma.section.create({
      data: {
        name: 'CS101-A',
        courseId: course1.id,
        instructorId: faculty.id,
        roomId: room1.id,
        timeSlotId: timeSlot1.id,
      },
    })

    const section2 = await prisma.section.create({
      data: {
        name: 'CS201-A',
        courseId: course2.id,
        instructorId: faculty.id,
        roomId: room2.id,
        timeSlotId: timeSlot2.id,
      },
    })

    console.log('📅 Creating sample schedule...')
    const schedule = await prisma.schedule.create({
      data: {
        name: 'Fall 2024 Schedule',
        status: 'DRAFT',
        version: 1,
      },
    })

    console.log('📝 Creating sample assignments...')
    await prisma.assignment.create({
      data: {
        scheduleId: schedule.id,
        sectionId: section1.id,
        studentId: student.id,
        courseId: course1.id,
      },
    })

    await prisma.assignment.create({
      data: {
        scheduleId: schedule.id,
        sectionId: section2.id,
        studentId: student.id,
        courseId: course2.id,
      },
    })

    console.log('✅ Database setup completed successfully!')
    console.log(`📊 Created:`)
    console.log(`   - ${await prisma.user.count()} users`)
    console.log(`   - ${await prisma.course.count()} courses`)
    console.log(`   - ${await prisma.section.count()} sections`)
    console.log(`   - ${await prisma.schedule.count()} schedules`)
    console.log(`   - ${await prisma.assignment.count()} assignments`)

  } catch (error) {
    console.error('❌ Error setting up database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
