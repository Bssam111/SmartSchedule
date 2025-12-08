import { prisma } from '../config/database'
import bcrypt from 'bcryptjs'

async function seedMajorsAndCommittee() {
  console.log('🌱 Seeding majors and committee account in Docker database...')

  try {
    // Seed majors
    const majors = [
      { name: 'Software Engineering' },
      { name: 'Computer Science' }
    ]

    for (const major of majors) {
      try {
        await prisma.major.upsert({
          where: { name: major.name },
          update: {},
          create: { name: major.name }
        })
        console.log(`✅ Seeded major: ${major.name}`)
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

    console.log('✅ Seeding completed')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedMajorsAndCommittee()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })

