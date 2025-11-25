import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCoursesAndRooms() {
  console.log('🌱 Seeding courses and rooms from curriculum plan...')

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

    // Define all courses from the curriculum plan
    const courses = [
      // First Period - Obligatory
      { code: 'ARAB 100', name: 'Writing Skills', credits: 3, level: 'Undergraduate' },
      { code: 'ENT 101', name: 'Entrepreneurship', credits: 3, level: 'Undergraduate' },
      { code: 'CT 101', name: 'Computer Skills and Artificial Intelligence', credits: 3, level: 'Undergraduate' },
      { code: 'MATH 101', name: 'Differential Calculus', credits: 3, level: 'Undergraduate' },
      { code: 'ENGS 100', name: 'English Language', credits: 3, level: 'Undergraduate' },
      
      // Second Period - Obligatory
      { code: 'CI 101', name: 'University Skills', credits: 3, level: 'Undergraduate' },
      { code: 'ENGS 110', name: 'English', credits: 3, level: 'Undergraduate' },
      { code: 'STAT 101', name: 'Introduction to Probability and Statistics', credits: 3, level: 'Undergraduate' },
      { code: 'CHEM 101', name: 'General Chemistry (1)', credits: 3, level: 'Undergraduate' },
      { code: 'EPH 101', name: 'Fitness and Health Education', credits: 2, level: 'Undergraduate' },
      
      // Third Period - Obligatory
      { code: 'CSC 111', name: 'Computer Programming (1)', credits: 3, level: 'Undergraduate' },
      { code: 'MATH 106', name: 'Integral Calculus', credits: 3, level: 'Undergraduate' },
      { code: 'PHYS 103', name: 'General Physics (1)', credits: 3, level: 'Undergraduate' },
      { code: 'MATH 151', name: 'Discrete Mathematics', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 113', name: 'Computer Programming -2-', credits: 3, level: 'Undergraduate' },
      
      // Fourth Period - Obligatory
      { code: 'PHYS 104', name: 'General Physics (2)', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 211', name: 'Introduction to Software Engineering', credits: 3, level: 'Undergraduate' },
      { code: 'CENX 303', name: 'Computer Communications & Networks', credits: 3, level: 'Undergraduate' },
      { code: 'MATH 244', name: 'Linear Algebra', credits: 3, level: 'Undergraduate' },
      
      // Fifth Period - Obligatory
      { code: 'SWE 312', name: 'Software Requirements Engineering', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 314', name: 'Software Security Engineering', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 212', name: 'Data Structures', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 220', name: 'Computer Organization', credits: 3, level: 'Undergraduate' },
      
      // Sixth Period - Obligatory
      { code: 'SWE 333', name: 'Software Quality Assurance', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 227', name: 'Operating Systems', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 321', name: 'Software Design & Architecture', credits: 3, level: 'Undergraduate' },
      { code: 'IS 230', name: 'Introduction to Database Systems', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 381', name: 'Web Application Development', credits: 3, level: 'Undergraduate' },
      
      // Seventh Period - Obligatory
      { code: 'IC 107', name: 'Professional Ethics', credits: 2, level: 'Undergraduate' },
      { code: 'SWE 479', name: 'Practical Training', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 477', name: 'Software Engineering Code of Ethics & Professional Practice', credits: 2, level: 'Undergraduate' },
      { code: 'SWE 434', name: 'Software Testing and Validation', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 482', name: 'Human-Computer Interaction', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 496', name: 'Graduation Project I', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 444', name: 'Software Construction Laboratory', credits: 3, level: 'Undergraduate' },
      
      // Eighth Period - Obligatory
      { code: 'IC 108', name: 'Current Issues', credits: 2, level: 'Undergraduate' },
      { code: 'SWE 466', name: 'Software Project Management', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 497', name: 'Graduation Project II', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 455', name: 'Software Maintenance and Evolution', credits: 3, level: 'Undergraduate' },
      
      // Elective Courses - Islamic Culture (4-2 credits)
      { code: 'IC 101', name: 'Principles of Islamic Culture', credits: 2, level: 'Undergraduate' },
      { code: 'IC 100', name: 'Studies in the Prophet Biography', credits: 2, level: 'Undergraduate' },
      { code: 'IC 103', name: 'Economic System in Islam', credits: 2, level: 'Undergraduate' },
      { code: 'IC 105', name: 'Human Rights', credits: 2, level: 'Undergraduate' },
      { code: 'IC 106', name: 'Medical Jurisprudence', credits: 2, level: 'Undergraduate' },
      { code: 'QURN 100', name: 'Quran Kareem', credits: 2, level: 'Undergraduate' },
      { code: 'IC 109', name: 'Development Role of Women', credits: 2, level: 'Undergraduate' },
      { code: 'IC 102', name: 'Family in Islam', credits: 2, level: 'Undergraduate' },
      { code: 'IC 104', name: 'Islamic Political System', credits: 2, level: 'Undergraduate' },
      
      // Elective Courses - Math/Science (6-6.0 credits)
      { code: 'MATH 254', name: 'Numerical Methods', credits: 3, level: 'Undergraduate' },
      { code: 'MATH 203', name: 'Differential & Integral Calculus', credits: 3, level: 'Undergraduate' },
      { code: 'OPER 122', name: 'Introduction to Operations Research', credits: 3, level: 'Undergraduate' },
      
      // Elective Courses - Science (3-3 credits)
      { code: 'GPH 201', name: 'Principles of Geophysics', credits: 3, level: 'Undergraduate' },
      { code: 'ZOOL 145', name: 'Biology', credits: 3, level: 'Undergraduate' },
      { code: 'BCH 101', name: 'General Biochemistry', credits: 3, level: 'Undergraduate' },
      { code: 'PHYS 201', name: 'Mathematical Physics (1)', credits: 3, level: 'Undergraduate' },
      { code: 'MBI 140', name: 'General Microbiology', credits: 3, level: 'Undergraduate' },
      
      // Elective Courses - Advanced (9-3 credits)
      { code: 'SWE 484', name: 'Multimedia Computing', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 215', name: 'Procedural Programming With C', credits: 3, level: 'Undergraduate' },
      { code: 'CENX 445', name: 'Network Protocols & Algorithms', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 486', name: 'Cloud Computing & Big Data', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 488', name: 'Complex Systems Engineering', credits: 3, level: 'Undergraduate' },
      { code: 'CENX 318', name: 'Embedded Systems Design', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 311', name: 'Design & Analysis of Algorithms', credits: 3, level: 'Undergraduate' },
      { code: 'IS 485', name: 'Enterprise Resource Planning Systems Lab', credits: 3, level: 'Undergraduate' },
      { code: 'CENX 316', name: 'Computer Architecture & Assembly Languages', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 485', name: 'Selected Topics in Software Engineering', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 478', name: 'Digital Image Processing and Analysis', credits: 3, level: 'Undergraduate' },
      { code: 'IS 385', name: 'Enterprise Resource Planning Systems', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 476', name: 'Computer Graphics', credits: 3, level: 'Undergraduate' },
      { code: 'CSC 361', name: 'Artificial Intelligence', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 481', name: 'Advanced Web Applications Engineering', credits: 3, level: 'Undergraduate' },
      { code: 'SWE 483', name: 'Mobile Application Development', credits: 3, level: 'Undergraduate' },
    ]

    // Create or update courses
    let createdCount = 0
    let skippedCount = 0
    
    for (const courseData of courses) {
      const level = courseData.level === 'Undergraduate' ? undergraduateLevel! : graduateLevel!
      
      const existingCourse = await prisma.course.findUnique({
        where: { code: courseData.code }
      })

      if (existingCourse) {
        skippedCount++
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
        createdCount++
        console.log(`✅ Created course: ${courseData.code} - ${courseData.name} (${courseData.credits} credits)`)
      }
    }

    // Define rooms
    const roomNumbers = [
      20, 22, 24, 26, 28,
      33, 34, 38, 44, 46,
      48, 55, 60, 62, 70
    ]

    let roomsCreated = 0
    let roomsSkipped = 0

    // Create or update rooms
    for (const roomNumber of roomNumbers) {
      const roomName = `Room ${roomNumber}`
      
      const existingRoom = await prisma.room.findUnique({
        where: { name: roomName }
      })

      if (existingRoom) {
        roomsSkipped++
        console.log(`⏭️  Room ${roomName} already exists, skipping...`)
      } else {
        await prisma.room.create({
          data: {
            name: roomName,
            capacity: 30, // Default capacity
            location: `Building ${roomNumber < 20 ? 'A' : 'B'}` // Assign building based on room number
          }
        })
        roomsCreated++
        console.log(`✅ Created room: ${roomName}`)
      }
    }

    console.log('\n🎉 Courses and rooms seeding completed!')
    console.log(`\n📚 Courses: ${createdCount} created, ${skippedCount} already existed`)
    console.log(`🏫 Rooms: ${roomsCreated} created, ${roomsSkipped} already existed`)
    console.log(`\n📊 Total courses in database: ${courses.length}`)
    console.log(`📊 Total rooms in database: ${roomNumbers.length}`)

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
