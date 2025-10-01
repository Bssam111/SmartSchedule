import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'

// GET /api/faculty/assignments - Get faculty assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')

    console.log('🔍 Faculty assignments API called with facultyId:', facultyId)

    if (!facultyId) {
      console.log('❌ No faculty ID provided')
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      )
    }

    // Get sections assigned to this faculty member
    console.log('🔍 Querying sections for instructorId:', facultyId)
    const sections = await prisma.section.findMany({
      where: {
        instructorId: facultyId
      },
      include: {
        course: true,
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: true
          }
        }
      }
    })

    console.log('🔍 Found sections:', sections.length)
    console.log('🔍 Sections data:', sections.map(s => ({ id: s.id, course: s.course.code, instructor: s.instructorId })))

    // Transform the data for the frontend
    const assignments = sections.map(section => ({
      id: section.id,
      course: {
        code: section.course.code,
        name: section.course.name
      },
      section: section.name,
      time: section.meetings.length > 0 ? 
        section.meetings.map(meeting => `${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime}`).join(', ') : 
        'TBD',
      room: section.room?.name || 'TBD',
      students: section.assignments.length,
      assignments: section.assignments.map(assignment => ({
        id: assignment.id,
        student: {
          id: assignment.student.id,
          name: assignment.student.name,
          email: assignment.student.email
        }
      }))
    }))

    console.log('🔍 Returning assignments:', assignments.length)
    console.log('🔍 Assignments data:', assignments)

    return NextResponse.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    console.error('Error fetching faculty assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty assignments' },
      { status: 500 }
    )
  }
}
