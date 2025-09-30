import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'

// GET /api/students/search - Search students by universityId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const universityId = searchParams.get('universityId')

    if (!universityId) {
      return NextResponse.json(
        { success: false, error: 'University ID is required' },
        { status: 400 }
      )
    }

    const student = await prisma.user.findUnique({
      where: {
        universityId: universityId,
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        universityId: true,
        role: true,
        createdAt: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found with this University ID' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: student
    })
  } catch (error) {
    console.error('Error searching student:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search student' },
      { status: 500 }
    )
  }
}
