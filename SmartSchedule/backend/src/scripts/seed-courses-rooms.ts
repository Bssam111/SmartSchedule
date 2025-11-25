import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCoursesAndRooms() {
  console.log('🌱 Seeding courses and rooms...')

  try {
    // First, ensure levels exist
    let undergraduateLevel = await prisma.level.findUnique({
      where: { name: 'Undergraduate' }
    })

    if (!undergraduateLevel) {
      undergraduateLevel = await prisma.level.create({
        data: { name: 'Undergraduate' }
      })
      console.log('✅ Created Undergraduate level')
    }

    let graduateLevel = await prisma.level.findUnique({
      where: { name: 'Graduate' }
    })

    if (!graduateLevel) {
      graduateLevel = await prisma.level.create({
        data: { name: 'Graduate' }
      })
      console.log('✅ Created Graduate level')
    }

    // Define courses
    const courses = [
      { code: 'SWE 343', name: 'Software Testing', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 333', name: 'Software Quality Assurance', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 321', name: 'Software Security', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 312', name: 'Software Requirements Engineering', credits: 3, level: 'Undergraduate' },
      { code: 'CS 111', name: 'Introduction to Computer Science', credits: 3, level: 'Undergraduate' },
      { code: 'CS 113', name: 'Programming Fundamentals', credits: 3, level: 'Undergraduate' },
      { code: 'CS 212', name: 'Data Structures', credits: 3, level: 'Undergraduate' }
    ]

    // Create or update courses
    for (const courseData of courses) {
      const level = courseData.level === 'Undergraduate' ? undergraduateLevel! : graduateLevel!
      
      const existingCourse = await prisma.course.findUnique({
        where: { code: courseData.code }
      })

      if (existingCourse) {
        console.log(`⏭️  Course ${courseData.code} already exists, skipping...`)
      } else {
        await prisma.course.create({
          data: {
            code: courseData.code,
            name: courseData.name,
            credits: courseData.credits,
            levelId: level.id
          }
        })
        console.log(`✅ Created course: ${courseData.code} - ${courseData.name}`)
      }
    }

    // Define rooms (starting from 12, 32 and choosing 10 total)
    const roomNumbers = [
      20, 22, 24, 26, 28,
      33, 34, 38, 44, 46,
      48, 55, 60, 62, 70
    ]

    // Create or update rooms
    for (const roomNumber of roomNumbers) {
      const roomName = `Room ${roomNumber}`
      
      const existingRoom = await prisma.room.findUnique({
        where: { name: roomName }
      })

      if (existingRoom) {
        console.log(`⏭️  Room ${roomName} already exists, skipping...`)
      } else {
        await prisma.room.create({
          data: {
            name: roomName,
            capacity: 30, // Default capacity
            location: `Building ${roomNumber < 20 ? 'A' : 'B'}` // Assign building based on room number
          }
        })
        console.log(`✅ Created room: ${roomName}`)
      }
    }

    console.log('\n🎉 Courses and rooms seeding completed!')
    console.log(`\n📚 Courses created: ${courses.length}`)
    console.log(`🏫 Rooms created: ${roomNumbers.length}`)
    console.log('\n📋 Summary:')
    console.log('Courses:', courses.map(c => c.code).join(', '))
    console.log('Rooms:', roomNumbers.map(r => `Room ${r}`).join(', '))

  } catch (error) {
    console.error('❌ Error seeding courses and rooms:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedCoursesAndRooms()
  .then(() => {
    console.log('\n✅ Seed completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })

