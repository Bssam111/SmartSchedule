import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'

// GET /api/sections/[id] - Get section by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const section = await prisma.section.findUnique({
      where: { id },
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

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: section
    })
  } catch (error) {
    console.error('Error fetching section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section' },
      { status: 500 }
    )
  }
}

// DELETE /api/sections/[id] - Delete section with cascading cleanup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        assignments: true,
        meetings: true
      }
    })

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    // Delete section with all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all assignments (enrollments) for this section
      await tx.assignment.deleteMany({
        where: { sectionId: id }
      })

      // Delete all meetings for this section
      await tx.sectionMeeting.deleteMany({
        where: { sectionId: id }
      })

      // Delete the section itself
      await tx.section.delete({
        where: { id }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully with all related data'
    })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}