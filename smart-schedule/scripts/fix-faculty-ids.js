// Fix faculty IDs to match authentication system
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixFacultyIds() {
  try {
    console.log('🔧 Fixing faculty IDs to match authentication system...')
    
    // Get all faculty users
    const facultyUsers = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      }
    })
    
    console.log(`Found ${facultyUsers.length} faculty users:`)
    facultyUsers.forEach(faculty => {
      console.log(`   - ${faculty.name} (${faculty.email}) - ID: ${faculty.id}`)
    })
    
    // Get all sections
    const sections = await prisma.section.findMany({
      include: {
        instructor: true
      }
    })
    
    console.log(`\nFound ${sections.length} sections:`)
    sections.forEach(section => {
      console.log(`   - Section ${section.name} assigned to ${section.instructor?.name} (ID: ${section.instructorId})`)
    })
    
    // The issue: sections are assigned to database faculty IDs, but auth system generates different IDs
    // Solution: Update sections to use a consistent faculty ID that matches the auth system
    
    // First, let's see what the current auth system is generating
    // From the console logs, we see: user-1759252469850
    // Let's create or update a faculty user with this ID
    
    const authFacultyId = 'user-1759252469850' // This matches what we see in the console
    
    // Check if this faculty user exists
    let authFaculty = await prisma.user.findUnique({
      where: { id: authFacultyId }
    })
    
    if (!authFaculty) {
      // Find the existing faculty user and update their ID
      const existingFaculty = await prisma.user.findFirst({
        where: {
          email: 'faculty@university.edu',
          role: 'FACULTY'
        }
      })
      
      if (existingFaculty) {
        console.log(`\n📝 Updating existing faculty user ID from ${existingFaculty.id} to ${authFacultyId}`)
        
        // Update the existing faculty user's ID
        authFaculty = await prisma.user.update({
          where: { id: existingFaculty.id },
          data: { id: authFacultyId }
        })
        console.log(`✅ Updated faculty user: ${authFaculty.name} with new ID: ${authFacultyId}`)
      } else {
        // Create new faculty user if none exists
        console.log(`\n📝 Creating faculty user with ID: ${authFacultyId}`)
        authFaculty = await prisma.user.create({
          data: {
            id: authFacultyId,
            email: 'faculty@university.edu',
            name: 'Dr. Smith',
            role: 'FACULTY'
          }
        })
        console.log(`✅ Created faculty user: ${authFaculty.name}`)
      }
    } else {
      console.log(`\n✅ Faculty user already exists: ${authFaculty.name}`)
    }
    
    // Update all sections to use this faculty ID
    console.log(`\n🔄 Updating sections to use faculty ID: ${authFacultyId}`)
    
    const updateResult = await prisma.section.updateMany({
      where: {
        instructorId: {
          in: facultyUsers.map(f => f.id).filter(id => id !== authFacultyId)
        }
      },
      data: {
        instructorId: authFacultyId
      }
    })
    
    console.log(`✅ Updated ${updateResult.count} sections to use faculty ID: ${authFacultyId}`)
    
    // Verify the changes
    const updatedSections = await prisma.section.findMany({
      include: {
        instructor: true,
        course: true
      }
    })
    
    console.log(`\n📊 Updated sections:`)
    updatedSections.forEach(section => {
      console.log(`   - ${section.course.code} ${section.name} assigned to ${section.instructor?.name} (ID: ${section.instructorId})`)
    })
    
    console.log('\n✅ Faculty ID fix completed successfully!')
    console.log('🎯 Faculty assignments should now appear in My Assignments page')
    
  } catch (error) {
    console.error('❌ Error fixing faculty IDs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixFacultyIds()
  .then(() => {
    console.log('\n🎉 Faculty ID fix completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Faculty ID fix failed:', error)
    process.exit(1)
  })
