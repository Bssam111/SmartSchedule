import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// POST /api/enroll - Enroll student in section
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sectionId, universityId } = body

    if (!sectionId || !universityId) {
      return NextResponse.json(
        { success: false, error: 'Section ID and University ID are required' },
        { status: 400 }
      )
    }

    // Find student by universityId
    const student = await prisma.user.findUnique({
      where: {
        universityId: universityId,
        role: 'STUDENT'
      }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found with this University ID' },
        { status: 404 }
      )
    }

    const studentId = student.id

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        meetings: true,
        assignments: true
      }
    })

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    // Check if student is already enrolled
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        sectionId,
        studentId
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Student is already enrolled in this section' },
        { status: 400 }
      )
    }

    // Check for conflicts using the new meeting-based system
    const conflictsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/conflicts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'enrollment',
        sectionId: section.id,
        studentId: studentId
      })
    })

    if (conflictsResponse.ok) {
      const conflictsResult = await conflictsResponse.json()
      if (conflictsResult.hasConflicts) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Time conflicts detected',
            conflicts: conflictsResult.conflicts
          },
          { status: 400 }
        )
      }
    }

    // Create a default schedule if none exists
    let schedule = await prisma.schedule.findFirst({
      where: { status: 'DRAFT' }
    })

    if (!schedule) {
      schedule = await prisma.schedule.create({
        data: {
          name: 'Default Schedule',
          status: 'DRAFT'
        }
      })
    }

    // Create the assignment (enrollment)
    const assignment = await prisma.assignment.create({
      data: {
        scheduleId: schedule.id,
        sectionId,
        studentId,
        courseId: section.courseId
      },
      include: {
        student: true,
        section: {
          include: {
            course: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Student enrolled successfully'
    })
  } catch (error) {
    console.error('Error enrolling student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to enroll student' },
      { status: 500 }
    )
  }
}
