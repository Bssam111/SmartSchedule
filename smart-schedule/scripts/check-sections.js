// Check sections and faculty assignments in detail
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkSections() {
  try {
    console.log('🔍 Checking sections and faculty assignments in detail...\n')

    // Check all users
    const users = await prisma.user.findMany()
    console.log(`👥 Users: ${users.length}`)
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ID: ${user.id}`)
    })

    // Check all sections
    const sections = await prisma.section.findMany({
      include: {
        course: true,
        instructor: true,
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: true
          }
        }
      }
    })

    console.log(`\n📖 Sections: ${sections.length}`)
    sections.forEach(section => {
      console.log(`   - ${section.course.code} ${section.name}`)
      console.log(`     ID: ${section.id}`)
      console.log(`     Instructor: ${section.instructor?.name || 'None'} (ID: ${section.instructorId})`)
      console.log(`     Room: ${section.room?.name || 'None'} (ID: ${section.roomId})`)
      console.log(`     Meetings: ${section.meetings.length}`)
      section.meetings.forEach(meeting => {
        console.log(`       ${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`)
      })
      console.log(`     Students: ${section.assignments.length}`)
      section.assignments.forEach(assignment => {
        console.log(`       - ${assignment.student.name} (${assignment.student.email})`)
      })
      console.log('')
    })

    // Check faculty assignments specifically
    const facultyUsers = users.filter(user => user.role === 'FACULTY')
    console.log(`\n🎓 Faculty Users: ${facultyUsers.length}`)
    
    for (const faculty of facultyUsers) {
      console.log(`\n📊 Checking assignments for ${faculty.name} (ID: ${faculty.id}):`)
      
      const facultySections = await prisma.section.findMany({
        where: {
          instructorId: faculty.id
        },
        include: {
          course: true,
          meetings: true,
          assignments: {
            include: {
              student: true
            }
          }
        }
      })
      
      console.log(`   Found ${facultySections.length} sections assigned to this faculty`)
      
      facultySections.forEach(section => {
        console.log(`   - ${section.course.code} ${section.name}`)
        console.log(`     Time: ${section.meetings.map(m => `${m.dayOfWeek} ${m.startTime}-${m.endTime}`).join(', ')}`)
        console.log(`     Students: ${section.assignments.length}`)
      })
    }

    // Check what the API would return for faculty assignments
    console.log(`\n🔍 Testing Faculty Assignments API response:`)
    const facultyId = facultyUsers[0]?.id
    if (facultyId) {
      console.log(`   Using faculty ID: ${facultyId}`)
      
      const sections = await prisma.section.findMany({
        where: {
          instructorId: facultyId
        },
        include: {
          course: true,
          room: true,
          meetings: true,
          assignments: {
            include: {
              student: true
            }
          }
        }
      })

      const assignments = sections.map(section => ({
        id: section.id,
        course: {
          code: section.course.code,
          name: section.course.name
        },
        section: section.name,
        time: section.meetings.length > 0 ? 
          section.meetings.map(meeting => `${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`).join(', ') : 
          'TBD',
        room: section.room?.name || 'TBD',
        students: section.assignments.length,
        assignments: section.assignments.map(assignment => ({
          id: assignment.id,
          student: {
            id: assignment.student.id,
            name: assignment.student.name,
            email: assignment.student.email
          }
        }))
      }))

      console.log(`   API would return ${assignments.length} assignments:`)
      console.log(JSON.stringify(assignments, null, 2))
    }

    console.log('\n✅ Section check completed!')

  } catch (error) {
    console.error('❌ Error checking sections:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkSections()
  .then(() => {
    console.log('\n🎉 Section check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Section check failed:', error)
    process.exit(1)
  })
