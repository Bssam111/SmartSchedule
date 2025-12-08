import { prisma } from '../config/database'
import bcrypt from 'bcryptjs'

async function seedCommitteeAndMajors() {
  console.log('🌱 Seeding committee account and majors...')

  // Seed majors
  const majors = [
    { name: 'Software Engineering', code: 'SWE' },
    { name: 'Computer Science', code: 'COMSCI' }
  ]

  for (const major of majors) {
    try {
      await prisma.major.upsert({
        where: { name: major.name },
        update: {
          code: major.code // Update code if it's missing
        },
        create: {
          name: major.name,
          code: major.code
        }
      })
      console.log(`✅ Seeded major: ${major.name} (${major.code})`)
    } catch (error) {
      console.error(`❌ Failed to seed major ${major.name}:`, error)
    }
  }

  // Seed committee account
  const committeeEmail = 'committee@ksu.edu.sa'
  const committeePassword = 'bssam2004'
  const hashedPassword = await bcrypt.hash(committeePassword, 12)

  try {
    const existingCommittee = await prisma.user.findUnique({
      where: { email: committeeEmail }
    })

    if (existingCommittee) {
      // Update existing committee account
      await prisma.user.update({
        where: { email: committeeEmail },
        data: {
          password: hashedPassword,
          role: 'COMMITTEE',
          name: 'Committee Member',
          requiresPasswordChange: false
        }
      })
      console.log(`✅ Updated committee account: ${committeeEmail}`)
    } else {
      // Create new committee account
      await prisma.user.create({
        data: {
          email: committeeEmail,
          password: hashedPassword,
          role: 'COMMITTEE',
          name: 'Committee Member',
          requiresPasswordChange: false
        }
      })
      console.log(`✅ Created committee account: ${committeeEmail}`)
    }
  } catch (error) {
    console.error(`❌ Failed to seed committee account:`, error)
  }

  // Seed admin account
  const adminEmail = 'admin@ksu.edu.sa'
  const adminPassword = 'admin123456' // Change this to a secure password
  const adminHashedPassword = await bcrypt.hash(adminPassword, 12)

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      // Update existing user to admin
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: adminHashedPassword,
          role: 'ADMIN',
          name: existingAdmin.name || 'Administrator',
          requiresPasswordChange: false
        }
      })
      console.log(`✅ Updated admin account: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
    } else {
      // Create new admin account
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: adminHashedPassword,
          role: 'ADMIN',
          name: 'Administrator',
          requiresPasswordChange: false
        }
      })
      console.log(`✅ Created admin account: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
    }
  } catch (error) {
    console.error(`❌ Failed to seed admin account:`, error)
  }

  console.log('✅ Seeding completed')
}

seedCommitteeAndMajors()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

