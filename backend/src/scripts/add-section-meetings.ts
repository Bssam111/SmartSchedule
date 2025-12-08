import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🕐 Adding section meetings to existing sections...')

  // Get all sections without meetings
  const sections = await prisma.section.findMany({
    include: {
      meetings: true,
      course: true
    }
  })

  let addedCount = 0
  let skippedCount = 0

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    
    if (section.meetings.length === 0) {
      // Create meetings for this section
      // Vary the schedule based on section index to avoid conflicts
      const dayPairs = [
        ['Sunday', 'Wednesday'],
        ['Monday', 'Thursday'],
        ['Tuesday', 'Wednesday'],
        ['Sunday', 'Tuesday'],
        ['Monday', 'Wednesday']
      ]
      
      const days = dayPairs[i % dayPairs.length]
      const hour = 8 + (i % 4) // 8, 9, 10, or 11
      
      await prisma.sectionMeeting.createMany({
        data: [
          {
            sectionId: section.id,
            dayOfWeek: days[0],
            startTime: `${hour}:00`,
            endTime: `${hour + 1}:50`
          },
          {
            sectionId: section.id,
            dayOfWeek: days[1],
            startTime: `${hour}:00`,
            endTime: `${hour + 1}:50`
          }
        ]
      })
      
      addedCount++
      console.log(`✅ Added meetings to section: ${section.name} (${section.course.code})`)
    } else {
      skippedCount++
      console.log(`ℹ️  Section ${section.name} already has ${section.meetings.length} meetings`)
    }
  }

  console.log(`\n✅ Completed!`)
  console.log(`   - Added meetings to ${addedCount} sections`)
  console.log(`   - Skipped ${skippedCount} sections (already have meetings)`)
}

main()
  .catch((e) => {
    console.error('❌ Error adding section meetings:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

