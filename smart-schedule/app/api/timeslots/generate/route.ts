import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'
import { generateTimeSlots } from '../../../../lib/validation'

// POST /api/timeslots/generate - Generate and populate time slots
export async function POST() {
  try {
    console.log('Generating time slots...')

    // Clear existing time slots
    await prisma.timeSlot.deleteMany({})
    console.log('Cleared existing time slots')

    // Generate time slots
    const timeSlots = generateTimeSlots()
    console.log(`Generated ${timeSlots.length} time slots`)

    // Insert all time slots
    await prisma.timeSlot.createMany({
      data: timeSlots
    })

    console.log('Time slots generated successfully!')
    
    // Return sample slots for verification
    const sampleSlots = await prisma.timeSlot.findMany({
      where: { dayOfWeek: 'Monday' },
      orderBy: { startTime: 'asc' },
      take: 5
    })
    
    return NextResponse.json({
      success: true,
      message: `Generated ${timeSlots.length} time slots successfully`,
      sampleSlots: sampleSlots.map(slot => ({
        day: slot.dayOfWeek,
        time: `${slot.startTime}-${slot.endTime}`
      }))
    })
  } catch (error) {
    console.error('Error generating time slots:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate time slots' },
      { status: 500 }
    )
  }
}
