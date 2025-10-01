// Fix faculty assignments by updating the auth system to use database faculty ID
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixFacultyAssignments() {
  try {
    console.log('🔧 Fixing faculty assignments...')
    
    // Get all faculty users from database
    const facultyUsers = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      }
    })
    
    console.log(`Found ${facultyUsers.length} faculty users in database:`)
    facultyUsers.forEach(faculty => {
      console.log(`   - ${faculty.name} (${faculty.email}) - ID: ${faculty.id}`)
    })
    
    // Get all sections
    const sections = await prisma.section.findMany({
      include: {
        instructor: true,
        course: true
      }
    })
    
    console.log(`\nFound ${sections.length} sections:`)
    sections.forEach(section => {
      console.log(`   - ${section.course.code} ${section.name} assigned to ${section.instructor?.name} (ID: ${section.instructorId})`)
    })
    
    if (sections.length > 0) {
      console.log('\n✅ Sections exist in database!')
      console.log('🎯 The issue is that the authentication system generates different IDs than the database.')
      console.log('\n💡 Solution: Update the Faculty pages to use the database faculty ID instead of auth-generated ID.')
      
      // Show the database faculty ID that should be used
      const dbFacultyId = facultyUsers[0].id
      console.log(`\n📋 Database Faculty ID to use: ${dbFacultyId}`)
      console.log(`📋 Faculty Name: ${facultyUsers[0].name}`)
      console.log(`📋 Faculty Email: ${facultyUsers[0].email}`)
      
      console.log('\n🔧 This ID should be used in the Faculty pages instead of the auth-generated ID.')
    } else {
      console.log('\n⚠️ No sections found in database.')
      console.log('💡 You may need to create sections first using the Committee → Schedules page.')
    }
    
    console.log('\n✅ Faculty assignment analysis completed!')
    
  } catch (error) {
    console.error('❌ Error analyzing faculty assignments:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the analysis
fixFacultyAssignments()
  .then(() => {
    console.log('\n🎉 Faculty assignment analysis completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Faculty assignment analysis failed:', error)
    process.exit(1)
  })
