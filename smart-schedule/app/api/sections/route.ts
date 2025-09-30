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
  try {
    // Parse the request body
    const body = await request.json()
    console.log('📝 Section creation request:', JSON.stringify(body, null, 2))
    
    // Validate the request body using Zod schema
    const validationResult = createSectionSchema.safeParse(body)
    
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.issues)
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

      // Check for duplicate meetings
      for (const meeting of meetings) {
        const existingMeeting = await prisma.sectionMeeting.findFirst({
          where: {
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            section: {
              instructorId: instructorId
            }
          }
        })
        
        if (existingMeeting) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Faculty already has a meeting on ${meeting.dayOfWeek} at ${meeting.startTime}-${meeting.endTime}` 
            },
            { status: 400 }
          )
        }
      }

      // Create section with meetings in a transaction
      console.log('🔄 Starting database transaction...')
      const section = await prisma.$transaction(async (tx) => {
        console.log('📝 Creating section...')
        // Create the section
        const newSection = await tx.section.create({
          data: {
            name: `Section-${Math.random().toString(36).substr(2, 4)}`, // Generate a unique section name
            courseId,
            instructorId,
            roomId
          }
        })
        console.log('✅ Section created:', newSection.id)

        console.log('📅 Creating meetings...')
        // Create the meetings
        const sectionMeetings = await Promise.all(
          meetings.map(meeting => {
            console.log(`  - Creating meeting: ${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`)
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
        console.log('✅ Meetings created:', sectionMeetings.length)

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
      console.log('✅ Transaction completed successfully')

      return NextResponse.json({
        success: true,
        data: section,
        message: 'Section created successfully'
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
