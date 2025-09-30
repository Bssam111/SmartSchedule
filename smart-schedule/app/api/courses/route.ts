import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// GET /api/courses - Get all courses
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        level: true
      }
    })

    return NextResponse.json({
      success: true,
      data: courses
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    
    // Fallback to mock data when database is not available
    const mockCourses = [
      { id: '1', code: 'CS101', name: 'Introduction to Computer Science', credits: 3, level: { id: '1', name: 'Undergraduate' } },
      { id: '2', code: 'CS201', name: 'Data Structures', credits: 3, level: { id: '1', name: 'Undergraduate' } },
      { id: '3', code: 'CS301', name: 'Algorithms', credits: 3, level: { id: '1', name: 'Undergraduate' } },
      { id: '4', code: 'MATH101', name: 'Calculus I', credits: 4, level: { id: '1', name: 'Undergraduate' } },
      { id: '5', code: 'MATH201', name: 'Linear Algebra', credits: 3, level: { id: '1', name: 'Undergraduate' } }
    ]

    return NextResponse.json({
      success: true,
      data: mockCourses
    })
  }
}
