const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Generate 50-minute time slots with 10-minute breaks
// Block 11:50-13:00 (lunch period)
// Sunday-Thursday only
async function generateTimeSlots() {
  try {
    console.log('Generating time slots...')

    // Clear existing time slots
    await prisma.timeSlot.deleteMany({})
    console.log('Cleared existing time slots')

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    const timeSlots = []

    // Generate slots from 08:00 to 20:00
    for (const day of days) {
      let currentTime = '08:00'
      
      while (currentTime < '20:00') {
        const startTime = currentTime
        const endTime = addMinutes(currentTime, 50)
        
        // Skip lunch period (11:50-13:00)
        if (startTime >= '11:50' && startTime < '13:00') {
          currentTime = '13:00'
          continue
        }
        
        // Don't create slots that would end after 20:00
        if (endTime > '20:00') {
          break
        }
        
        timeSlots.push({
          day,
          startTime,
          endTime
        })
        
        // Move to next slot (50 minutes + 10 minute break)
        currentTime = addMinutes(endTime, 10)
      }
    }

    // Insert all time slots
    await prisma.timeSlot.createMany({
      data: timeSlots
    })

    console.log(`Generated ${timeSlots.length} time slots`)
    console.log('Time slots generated successfully!')
    
    // Display sample slots
    const sampleSlots = await prisma.timeSlot.findMany({
      where: { day: 'Monday' },
      orderBy: { startTime: 'asc' },
      take: 5
    })
    
    console.log('\nSample Monday slots:')
    sampleSlots.forEach(slot => {
      console.log(`${slot.startTime}-${slot.endTime}`)
    })

  } catch (error) {
    console.error('Error generating time slots:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function addMinutes(timeString, minutes) {
  const [hours, mins] = timeString.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

generateTimeSlots()
