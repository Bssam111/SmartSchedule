import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// GET /api/timeslots - Get all time slots
export async function GET() {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        startTime: {
          gte: '08:00'
        },
        endTime: {
          lte: '20:00'
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: timeSlots
    })
  } catch (error) {
    console.error('Error fetching time slots:', error)
    
    // Fallback to mock data when database is not available
    const mockTimeSlots = [
      // Sunday
      { id: '1', dayOfWeek: 'Sunday', startTime: '08:00', endTime: '08:50' },
      { id: '2', dayOfWeek: 'Sunday', startTime: '09:00', endTime: '09:50' },
      { id: '3', dayOfWeek: 'Sunday', startTime: '10:00', endTime: '10:50' },
      { id: '4', dayOfWeek: 'Sunday', startTime: '11:00', endTime: '11:50' },
      { id: '5', dayOfWeek: 'Sunday', startTime: '13:00', endTime: '13:50' },
      { id: '6', dayOfWeek: 'Sunday', startTime: '14:00', endTime: '14:50' },
      { id: '7', dayOfWeek: 'Sunday', startTime: '15:00', endTime: '15:50' },
      { id: '8', dayOfWeek: 'Sunday', startTime: '16:00', endTime: '16:50' },
      { id: '9', dayOfWeek: 'Sunday', startTime: '17:00', endTime: '17:50' },
      { id: '10', dayOfWeek: 'Sunday', startTime: '18:00', endTime: '18:50' },
      { id: '11', dayOfWeek: 'Sunday', startTime: '19:00', endTime: '19:50' },
      
      // Monday
      { id: '12', dayOfWeek: 'Monday', startTime: '08:00', endTime: '08:50' },
      { id: '13', dayOfWeek: 'Monday', startTime: '09:00', endTime: '09:50' },
      { id: '14', dayOfWeek: 'Monday', startTime: '10:00', endTime: '10:50' },
      { id: '15', dayOfWeek: 'Monday', startTime: '11:00', endTime: '11:50' },
      { id: '16', dayOfWeek: 'Monday', startTime: '13:00', endTime: '13:50' },
      { id: '17', dayOfWeek: 'Monday', startTime: '14:00', endTime: '14:50' },
      { id: '18', dayOfWeek: 'Monday', startTime: '15:00', endTime: '15:50' },
      { id: '19', dayOfWeek: 'Monday', startTime: '16:00', endTime: '16:50' },
      { id: '20', dayOfWeek: 'Monday', startTime: '17:00', endTime: '17:50' },
      { id: '21', dayOfWeek: 'Monday', startTime: '18:00', endTime: '18:50' },
      { id: '22', dayOfWeek: 'Monday', startTime: '19:00', endTime: '19:50' },
      
      // Tuesday
      { id: '23', dayOfWeek: 'Tuesday', startTime: '08:00', endTime: '08:50' },
      { id: '24', dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '09:50' },
      { id: '25', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '10:50' },
      { id: '26', dayOfWeek: 'Tuesday', startTime: '11:00', endTime: '11:50' },
      { id: '27', dayOfWeek: 'Tuesday', startTime: '13:00', endTime: '13:50' },
      { id: '28', dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '14:50' },
      { id: '29', dayOfWeek: 'Tuesday', startTime: '15:00', endTime: '15:50' },
      { id: '30', dayOfWeek: 'Tuesday', startTime: '16:00', endTime: '16:50' },
      { id: '31', dayOfWeek: 'Tuesday', startTime: '17:00', endTime: '17:50' },
      { id: '32', dayOfWeek: 'Tuesday', startTime: '18:00', endTime: '18:50' },
      { id: '33', dayOfWeek: 'Tuesday', startTime: '19:00', endTime: '19:50' },
      
      // Wednesday
      { id: '34', dayOfWeek: 'Wednesday', startTime: '08:00', endTime: '08:50' },
      { id: '35', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '09:50' },
      { id: '36', dayOfWeek: 'Wednesday', startTime: '10:00', endTime: '10:50' },
      { id: '37', dayOfWeek: 'Wednesday', startTime: '11:00', endTime: '11:50' },
      { id: '38', dayOfWeek: 'Wednesday', startTime: '13:00', endTime: '13:50' },
      { id: '39', dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '14:50' },
      { id: '40', dayOfWeek: 'Wednesday', startTime: '15:00', endTime: '15:50' },
      { id: '41', dayOfWeek: 'Wednesday', startTime: '16:00', endTime: '16:50' },
      { id: '42', dayOfWeek: 'Wednesday', startTime: '17:00', endTime: '17:50' },
      { id: '43', dayOfWeek: 'Wednesday', startTime: '18:00', endTime: '18:50' },
      { id: '44', dayOfWeek: 'Wednesday', startTime: '19:00', endTime: '19:50' },
      
      // Thursday
      { id: '45', dayOfWeek: 'Thursday', startTime: '08:00', endTime: '08:50' },
      { id: '46', dayOfWeek: 'Thursday', startTime: '09:00', endTime: '09:50' },
      { id: '47', dayOfWeek: 'Thursday', startTime: '10:00', endTime: '10:50' },
      { id: '48', dayOfWeek: 'Thursday', startTime: '11:00', endTime: '11:50' },
      { id: '49', dayOfWeek: 'Thursday', startTime: '13:00', endTime: '13:50' },
      { id: '50', dayOfWeek: 'Thursday', startTime: '14:00', endTime: '14:50' },
      { id: '51', dayOfWeek: 'Thursday', startTime: '15:00', endTime: '15:50' },
      { id: '52', dayOfWeek: 'Thursday', startTime: '16:00', endTime: '16:50' },
      { id: '53', dayOfWeek: 'Thursday', startTime: '17:00', endTime: '17:50' },
      { id: '54', dayOfWeek: 'Thursday', startTime: '18:00', endTime: '18:50' },
      { id: '55', dayOfWeek: 'Thursday', startTime: '19:00', endTime: '19:50' }
    ]

    return NextResponse.json({
      success: true,
      data: mockTimeSlots
    })
  }
}

// POST /api/timeslots - Create new time slot (with validation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dayOfWeek, startTime, endTime } = body

    // Validate required fields
    if (!dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Day of week, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate day (Sunday-Thursday only)
    const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    if (!validDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { success: false, error: 'Day must be Sunday through Thursday' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { success: false, error: 'Time must be in HH:MM format' },
        { status: 400 }
      )
    }

    // Validate time range (08:00-20:00)
    if (startTime < '08:00' || endTime > '20:00') {
      return NextResponse.json(
        { success: false, error: 'Time slots must be between 08:00 and 20:00' },
        { status: 400 }
      )
    }

    // Block lunch period (11:50-13:00)
    if ((startTime >= '11:50' && startTime < '13:00') || 
        (endTime > '11:50' && endTime <= '13:00') ||
        (startTime < '11:50' && endTime > '13:00')) {
      return NextResponse.json(
        { success: false, error: 'Time slots cannot overlap with lunch period (11:50-13:00)' },
        { status: 400 }
      )
    }

    // Validate 50-minute duration
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const duration = endMinutes - startMinutes
    
    if (duration !== 50) {
      return NextResponse.json(
        { success: false, error: 'Time slots must be exactly 50 minutes long' },
        { status: 400 }
      )
    }

    // Check for conflicts
    const conflict = await prisma.timeSlot.findFirst({
      where: {
        dayOfWeek,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      }
    })

    if (conflict) {
      return NextResponse.json(
        { success: false, error: `Time slot conflicts with existing slot: ${conflict.startTime}-${conflict.endTime}` },
        { status: 400 }
      )
    }

    // Create the time slot
    const timeSlot = await prisma.timeSlot.create({
      data: {
        dayOfWeek,
        startTime,
        endTime
      }
    })

    return NextResponse.json({
      success: true,
      data: timeSlot,
      message: 'Time slot created successfully'
    })
  } catch (error) {
    console.error('Error creating time slot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create time slot' },
      { status: 500 }
    )
  }
}

// Helper function to convert time string to minutes
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}
