import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/database'

// DELETE /api/sections/[id]/unenroll - Unenroll student from section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sectionId } = await params
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Find and delete the assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        sectionId,
        studentId
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Student is not enrolled in this section' },
        { status: 404 }
      )
    }

    await prisma.assignment.delete({
      where: { id: assignment.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Student unenrolled successfully'
    })
  } catch (error) {
    console.error('Error unenrolling student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unenroll student' },
      { status: 500 }
    )
  }
}
