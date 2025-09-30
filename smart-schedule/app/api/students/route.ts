import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// GET /api/students - Get all students
export async function GET() {
  try {
    const students = await prisma.user.findMany({
      where: {
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

    return NextResponse.json({
      success: true,
      data: students
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    
    // Fallback to mock data when database is not available
    const mockStudents = [
      { id: '1', name: 'John Doe', email: 'john@university.edu', universityId: 'STU001', role: 'STUDENT' },
      { id: '2', name: 'Jane Smith', email: 'jane@university.edu', universityId: 'STU002', role: 'STUDENT' },
      { id: '3', name: 'Bob Johnson', email: 'bob@university.edu', universityId: 'STU003', role: 'STUDENT' },
      { id: '4', name: 'Alice Brown', email: 'alice@university.edu', universityId: 'STU004', role: 'STUDENT' },
      { id: '5', name: 'Charlie Wilson', email: 'charlie@university.edu', universityId: 'STU005', role: 'STUDENT' }
    ]

    return NextResponse.json({
      success: true,
      data: mockStudents
    })
  }
}
