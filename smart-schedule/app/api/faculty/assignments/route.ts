import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'

// GET /api/faculty/assignments - Get faculty assignments
export async function GET(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')

    console.log(`[${requestId}] 🔍 Faculty assignments API called with facultyId:`, facultyId)

    if (!facultyId) {
      console.log(`[${requestId}] ❌ No faculty ID provided`)
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      )
    }

    // Get sections assigned to this faculty member
    console.log(`[${requestId}] 🔍 Querying sections for instructorId:`, facultyId)
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
    
    console.log(`[${requestId}] 🔍 Found sections:`, sections.length)
    console.log(`[${requestId}] 🔍 Sections data:`, sections.map(s => ({ 
      id: s.id, 
      course: s.course.code, 
      instructor: s.instructorId,
      meetings: s.meetings.length,
      assignments: s.assignments.length
    })))

    // Transform the data for the frontend using canonical linkage (Sections.instructorId)
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
    
    console.log(`[${requestId}] 📋 Returning ${assignments.length} assignments for faculty ${facultyId}`)


    const response = NextResponse.json({
      success: true,
      data: assignments
    })
    
    // Add cache-busting headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching faculty assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty assignments' },
      { status: 500 }
    )
  }
}
