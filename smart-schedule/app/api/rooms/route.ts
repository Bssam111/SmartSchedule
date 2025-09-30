import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// GET /api/rooms - Get all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany()

    return NextResponse.json({
      success: true,
      data: rooms
    })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    
    // Fallback to mock data when database is not available
    const mockRooms = [
      { id: '1', name: 'Room 101', capacity: 30 },
      { id: '2', name: 'Room 102', capacity: 25 },
      { id: '3', name: 'Room 201', capacity: 40 },
      { id: '4', name: 'Room 202', capacity: 35 },
      { id: '5', name: 'Room 301', capacity: 50 },
      { id: '6', name: 'Room 302', capacity: 45 },
      { id: '7', name: 'Room 401', capacity: 60 },
      { id: '8', name: 'Room 402', capacity: 55 }
    ]

    return NextResponse.json({
      success: true,
      data: mockRooms
    })
  }
}
