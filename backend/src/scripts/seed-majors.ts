import { prisma } from '../config/database'

async function seedMajors() {
  console.log('🌱 Seeding majors...')

  const majors = [
    { code: 'SWE', name: 'Software Engineering' },
    { code: 'CS', name: 'Computer Science' }
  ]

  for (const major of majors) {
    try {
      await prisma.major.upsert({
        where: { code: major.code },
        update: {},
        create: { code: major.code, name: major.name }
      })
      console.log(`✅ Seeded major: ${major.name}`)
    } catch (error) {
      console.error(`❌ Failed to seed major ${major.name}:`, error)
    }
  }

  console.log('✅ Majors seeding completed')
}

seedMajors()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

