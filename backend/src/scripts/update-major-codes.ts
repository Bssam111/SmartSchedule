import { prisma } from '../config/database'

async function updateMajorCodes() {
  try {
    const majors = await prisma.major.findMany()
    
    for (const major of majors) {
      let code: string
      if (major.name === 'Software Engineering') {
        code = 'SWE'
      } else {
        // Generate code from name
        code = major.name
          .split(' ')
          .map(word => word.substring(0, 3).toUpperCase())
          .join('')
          .substring(0, 10)
      }
      
      await prisma.major.update({
        where: { id: major.id },
        data: { code }
      })
      
      console.log(`✅ Updated ${major.name} with code: ${code}`)
    }
    
    console.log('✅ All majors updated')
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Error updating majors:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

updateMajorCodes()

