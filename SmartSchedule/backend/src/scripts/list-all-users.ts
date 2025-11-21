import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listAllUsers() {
  console.log('📋 Fetching all registered users...\n')

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            authenticators: true
          }
        }
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found in the database.')
      return
    }

    console.log(`✅ Found ${users.length} registered user(s):\n`)
    console.log('='.repeat(100))
    console.log(
      'ID'.padEnd(30),
      'Email'.padEnd(35),
      'Name'.padEnd(25),
      'Role'.padEnd(12),
      'University ID'.padEnd(15),
      'Fingerprints'.padEnd(12),
      'Created At'
    )
    console.log('='.repeat(100))

    users.forEach((user, index) => {
      console.log(
        user.id.substring(0, 28).padEnd(30),
        user.email.padEnd(35),
        user.name.substring(0, 23).padEnd(25),
        user.role.padEnd(12),
        (user.universityId || 'N/A').padEnd(15),
        user._count.authenticators.toString().padEnd(12),
        user.createdAt.toLocaleString()
      )
    })

    console.log('='.repeat(100))
    console.log(`\n📊 Summary:`)
    console.log(`   Total Users: ${users.length}`)
    console.log(`   Students: ${users.filter(u => u.role === 'STUDENT').length}`)
    console.log(`   Faculty: ${users.filter(u => u.role === 'FACULTY').length}`)
    console.log(`   Committee: ${users.filter(u => u.role === 'COMMITTEE').length}`)
    console.log(`   Users with Fingerprints: ${users.filter(u => u._count.authenticators > 0).length}`)
    console.log(`   Users without Fingerprints: ${users.filter(u => u._count.authenticators === 0).length}`)

  } catch (error) {
    console.error('❌ Error fetching users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
listAllUsers()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })

