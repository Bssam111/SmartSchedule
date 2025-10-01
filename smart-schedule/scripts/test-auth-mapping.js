// Test authentication mapping to verify faculty linking
const { AuthService } = require('../lib/auth')

async function testAuthMapping() {
  try {
    console.log('🧪 Testing Authentication Mapping...\n')

    // Test faculty authentication
    console.log('🔐 Testing faculty authentication with faculty@university.edu...')
    const authService = AuthService.getInstance()
    
    const result = await authService.login('faculty@university.edu', 'password', 'faculty')
    
    if (result.success) {
      console.log('✅ Login successful!')
      const user = authService.getCurrentUser()
      console.log('👤 Authenticated user:', user)
      
      if (user && user.id === 'cmg6bgyv70005b7pzt29pdr4k') {
        console.log('✅ Faculty ID matches database ID!')
        console.log('🎯 Faculty assignments should now appear in Dashboard and My Assignments')
      } else {
        console.log('❌ Faculty ID does not match database ID')
        console.log(`   Expected: cmg6bgyv70005b7pzt29pdr4k`)
        console.log(`   Got: ${user?.id}`)
      }
    } else {
      console.log('❌ Login failed:', result.error)
    }

    console.log('\n🔐 Testing other user types...')
    
    // Test student authentication
    const studentResult = await authService.login('student@university.edu', 'password', 'student')
    if (studentResult.success) {
      const student = authService.getCurrentUser()
      console.log('👤 Student user:', student)
      console.log(`   Expected ID: cmg6bgyv30004b7pz3a6ppa7u`)
      console.log(`   Got ID: ${student?.id}`)
    }

    // Test committee authentication
    const committeeResult = await authService.login('committee@university.edu', 'password', 'committee')
    if (committeeResult.success) {
      const committee = authService.getCurrentUser()
      console.log('👤 Committee user:', committee)
      console.log(`   Expected ID: cmg6bgyv80006b7pz95bo7v7x`)
      console.log(`   Got ID: ${committee?.id}`)
    }

    console.log('\n✅ Authentication mapping test completed!')

  } catch (error) {
    console.error('❌ Error testing authentication mapping:', error)
    throw error
  }
}

// Run the test
testAuthMapping()
  .then(() => {
    console.log('\n🎉 Authentication mapping test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Authentication mapping test failed:', error)
    process.exit(1)
  })
