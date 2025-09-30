import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// GET /api/users - Get all users (for instructor selection)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'FACULTY'
      }
    })

    return NextResponse.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    
    // Fallback to mock data when database is not available
    const mockUsers = [
      { id: '1', name: 'Dr. Smith', email: 'smith@university.edu', role: 'FACULTY' },
      { id: '2', name: 'Prof. Johnson', email: 'johnson@university.edu', role: 'FACULTY' },
      { id: '3', name: 'Dr. Brown', email: 'brown@university.edu', role: 'FACULTY' },
      { id: '4', name: 'Prof. Davis', email: 'davis@university.edu', role: 'FACULTY' },
      { id: '5', name: 'Dr. Wilson', email: 'wilson@university.edu', role: 'FACULTY' }
    ]

    return NextResponse.json({
      success: true,
      data: mockUsers
    })
  }
}
