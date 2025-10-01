import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'
import { createSectionSchema } from '../../../lib/validation'

// GET /api/sections - Get all sections
export async function GET() {
  try {
    console.log('🔍 Fetching sections from database...')
    
    // Try to use database first
    const sections = await prisma.section.findMany({
      include: {
        course: true,
        instructor: true,
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: true
          }
        }
      }
    })

    console.log(`✅ Found ${sections.length} sections`)
    return NextResponse.json({
      success: true,
      data: sections
    })
  } catch (error) {
    console.error('❌ Error fetching sections:', error)
    console.error('❌ Full error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sections',
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}

// POST /api/sections - Create new section
export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`[${requestId}] 📝 Section creation request started`)
    
    // Parse the request body
    const body = await request.json()
    console.log(`[${requestId}] 📝 Section creation payload:`, JSON.stringify(body, null, 2))
    console.log(`[${requestId}] 📝 Normalized instructorId:`, body.instructorId)
    
    // Validate the request body using Zod schema
    const validationResult = createSectionSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log(`[${requestId}] ❌ Validation failed:`, validationResult.error.issues)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const { courseId, instructorId, roomId, meetings, capacity } = validationResult.data
    
    // Validate instructorId is provided and not null/undefined
    if (!instructorId) {
      console.log(`[${requestId}] ❌ No instructorId provided`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'INSTRUCTOR_REQUIRED',
          message: 'Instructor ID is required to create a section'
        },
        { status: 400 }
      )
    }
    
    // Verify instructor exists in database
    const instructor = await prisma.user.findUnique({
      where: { id: instructorId },
      select: { id: true, name: true, role: true }
    })
    
    if (!instructor) {
      console.log(`[${requestId}] ❌ Instructor not found:`, instructorId)
      return NextResponse.json(
        { 
          success: false, 
          error: 'INSTRUCTOR_NOT_FOUND',
          message: 'Instructor not found in database'
        },
        { status: 400 }
      )
    }
    
    if (instructor.role !== 'FACULTY') {
      console.log(`[${requestId}] ❌ User is not a faculty member:`, instructor.role)
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_INSTRUCTOR_ROLE',
          message: 'User must be a faculty member to be assigned as instructor'
        },
        { status: 400 }
      )
    }
    
    console.log(`[${requestId}] ✅ Instructor validated:`, instructor.name, `(${instructor.role})`)

    // Meetings are already validated by Zod schema

    // Try to use database first, fallback to mock response
    try {
      console.log('🔍 Checking course:', courseId)
      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      })
      if (!course) {
        console.log('❌ Course not found:', courseId)
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        )
      }
      console.log('✅ Course found:', course.code)

      // Check if instructor exists
      const instructor = await prisma.user.findUnique({
        where: { id: instructorId, role: 'FACULTY' }
      })
      if (!instructor) {
        return NextResponse.json(
          { success: false, error: 'Instructor not found or not a faculty member' },
          { status: 404 }
        )
      }

      // Check if room exists
      const room = await prisma.room.findUnique({
        where: { id: roomId }
      })
      if (!room) {
        return NextResponse.json(
          { success: false, error: 'Room not found' },
          { status: 404 }
        )
      }

      // Check faculty availability
      const facultyPreferences = await prisma.preference.findFirst({
        where: {
          userId: instructorId,
          type: 'availability'
        }
      })

      if (facultyPreferences) {
        const facultyAvailability = JSON.parse(facultyPreferences.value as string)
        
        for (const meeting of meetings) {
          const day = meeting.dayOfWeek.toLowerCase()
          const timeSlot = `${meeting.startTime}-${meeting.endTime}`
          
          // Check if faculty has availability set for this day
          if (facultyAvailability[day]) {
            // Check if the time slot is available (not in unavailable list)
            const unavailableSlots = facultyAvailability[day].unavailable || []
            if (unavailableSlots.includes(timeSlot)) {
              return NextResponse.json(
                { 
                  success: false, 
                  error: `Faculty is not available on ${meeting.dayOfWeek} at ${meeting.startTime}-${meeting.endTime}`,
                  conflictType: 'faculty_availability',
                  conflictDetails: {
                    day: meeting.dayOfWeek,
                    time: `${meeting.startTime}-${meeting.endTime}`,
                    instructor: instructor.name,
                    reason: 'Faculty marked this time slot as unavailable'
                  }
                },
                { status: 400 }
              )
            }
          }
        }
      }

      // Check for faculty conflicts
      for (const meeting of meetings) {
        const existingFacultyMeeting = await prisma.sectionMeeting.findFirst({
          where: {
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            section: {
              instructorId: instructorId
            }
          },
          include: {
            section: {
              include: {
                course: true,
                instructor: true
              }
            }
          }
        })
        
        if (existingFacultyMeeting) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Faculty already has a meeting on ${meeting.dayOfWeek} at ${meeting.startTime}-${meeting.endTime}`,
              conflictType: 'faculty_schedule',
              conflictDetails: {
                day: meeting.dayOfWeek,
                time: `${meeting.startTime}-${meeting.endTime}`,
                existingCourse: existingFacultyMeeting.section.course.code,
                instructor: existingFacultyMeeting.section.instructor.name
              }
            },
            { status: 400 }
          )
        }

        // Check for room conflicts
        const existingRoomMeeting = await prisma.sectionMeeting.findFirst({
          where: {
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            section: {
              roomId: roomId
            }
          },
          include: {
            section: {
              include: {
                course: true,
                instructor: true
              }
            }
          }
        })
        
        if (existingRoomMeeting) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Room already occupied on ${meeting.dayOfWeek} at ${meeting.startTime}-${meeting.endTime}`,
              conflictType: 'room_schedule',
              conflictDetails: {
                day: meeting.dayOfWeek,
                time: `${meeting.startTime}-${meeting.endTime}`,
                existingCourse: existingRoomMeeting.section.course.code,
                instructor: existingRoomMeeting.section.instructor.name,
                room: room.name
              }
            },
            { status: 400 }
          )
        }
      }

      // Create section with meetings in a transaction
      console.log(`[${requestId}] 🔄 Starting database transaction...`)
      const section = await prisma.$transaction(async (tx) => {
        console.log(`[${requestId}] 📝 Creating section with instructorId:`, instructorId)
        // Create the section
        const newSection = await tx.section.create({
          data: {
            name: `Section-${Math.random().toString(36).substr(2, 4)}`, // Generate a unique section name
            courseId,
            instructorId,
            roomId
          }
        })
        console.log(`[${requestId}] ✅ Section created:`, newSection.id, 'for instructor:', instructorId)

        console.log(`[${requestId}] 📅 Creating meetings...`)
        // Create the meetings
        const sectionMeetings = await Promise.all(
          meetings.map(meeting => {
            console.log(`[${requestId}]   - Creating meeting: ${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`)
            return tx.sectionMeeting.create({
              data: {
                sectionId: newSection.id,
                dayOfWeek: meeting.dayOfWeek,
                startTime: meeting.startTime,
                endTime: meeting.endTime
              }
            })
          })
        )
        console.log(`[${requestId}] ✅ Meetings created:`, sectionMeetings.length)

        console.log('🔍 Fetching section with relations...')
        // Return section with meetings
        return await tx.section.findUnique({
          where: { id: newSection.id },
          include: {
            course: true,
            instructor: true,
            room: true,
            meetings: true
          }
        })
      })
      console.log(`[${requestId}] ✅ Transaction completed successfully`)

      // Cache invalidation - dispatch custom event for frontend cache invalidation
      console.log(`[${requestId}] 🔄 Dispatching sectionCreated event for instructor:`, instructorId)
      
      return NextResponse.json({
        success: true,
        data: section,
        message: 'Section created successfully',
        instructorId: instructorId // Include instructorId for cache invalidation
      })
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      console.error('❌ Full error details:', JSON.stringify(dbError, null, 2))
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database operation failed',
          details: dbError.message,
          type: dbError.constructor.name
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error creating section:', error)
    console.error('❌ Full error details:', JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create section',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    )
  }
}
