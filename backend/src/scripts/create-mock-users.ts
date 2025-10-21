import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createMockUsers() {
  console.log('🔧 Creating mock users for testing...')

  try {
    // Clean up existing users
    await prisma.user.deleteMany()

    const hashedPassword = await bcrypt.hash('TestPassword123!', 12)

    // Create mock users
    const users = [
      {
        email: 'student@demo.com',
        password: hashedPassword,
        name: 'Demo Student',
        role: 'STUDENT',
        universityId: 'STU001'
      },
      {
        email: 'faculty@demo.com',
        password: hashedPassword,
        name: 'Demo Faculty',
        role: 'FACULTY',
        universityId: 'FAC001'
      },
      {
        email: 'committee@demo.com',
        password: hashedPassword,
        name: 'Demo Committee',
        role: 'COMMITTEE',
        universityId: 'COM001'
      },
      {
        email: 'admin@demo.com',
        password: hashedPassword,
        name: 'Demo Admin',
        role: 'COMMITTEE',
        universityId: 'ADM001'
      }
    ]

    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          universityId: true
        }
      })
      console.log(`✅ Created ${user.role}: ${user.email}`)
    }

    console.log('\n🎉 Mock users created successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('┌─────────────────┬─────────────────┬─────────────┐')
    console.log('│ Email           │ Password        │ Role        │')
    console.log('├─────────────────┼─────────────────┼─────────────┤')
    console.log('│ student@demo.com│ TestPassword123!│ STUDENT     │')
    console.log('│ faculty@demo.com│ TestPassword123!│ FACULTY     │')
    console.log('│ committee@demo.com│ TestPassword123!│ COMMITTEE   │')
    console.log('│ admin@demo.com  │ TestPassword123!│ COMMITTEE   │')
    console.log('└─────────────────┴─────────────────┴─────────────┘')

  } catch (error) {
    console.error('❌ Error creating mock users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createMockUsers()
  .then(() => {
    console.log('\n✅ Mock users setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to create mock users:', error)
    process.exit(1)
  })
