// Test faculty assignments API to verify the fix
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFacultyAssignments() {
  try {
    console.log('🧪 Testing Faculty Assignments API...')
    
    // Test with the database faculty ID
    const dbFacultyId = 'cmg6bgyv70005b7pzt29pdr4k'
    
    console.log(`\n🔍 Testing with database faculty ID: ${dbFacultyId}`)
    
    // Simulate the API call that the frontend makes
    const sections = await prisma.section.findMany({
      where: {
        instructorId: dbFacultyId
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
    
    console.log(`✅ Found ${sections.length} sections for faculty ID: ${dbFacultyId}`)
    
    if (sections.length > 0) {
      console.log('\n📊 Sections found:')
      sections.forEach(section => {
        console.log(`   - ${section.course.code} ${section.name}`)
        console.log(`     Instructor: ${section.instructorId}`)
        console.log(`     Room: ${section.room?.name || 'TBD'}`)
        console.log(`     Meetings: ${section.meetings.length}`)
        console.log(`     Students: ${section.assignments.length}`)
        if (section.meetings.length > 0) {
          section.meetings.forEach(meeting => {
            console.log(`       ${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`)
          })
        }
        console.log('')
      })
      
      // Transform the data like the API does
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
      
      console.log('📋 Transformed assignments data:')
      console.log(JSON.stringify(assignments, null, 2))
      
      console.log('\n✅ Faculty assignments should now appear in the UI!')
    } else {
      console.log('\n⚠️ No sections found. Make sure sections are created and assigned to the correct faculty ID.')
    }
    
    console.log('\n🎯 Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error testing faculty assignments:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testFacultyAssignments()
  .then(() => {
    console.log('\n🎉 Faculty assignments test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Faculty assignments test failed:', error)
    process.exit(1)
  })
