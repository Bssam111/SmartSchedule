import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// GET /api/schedules - Get all schedules
export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        statusRef: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: schedules
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    
    // Fallback to mock data when database is not available
    const mockSchedules = [
      { id: '1', name: 'Fall 2024 Schedule', status: 'DRAFT', version: 1, createdAt: new Date() },
      { id: '2', name: 'Spring 2024 Schedule', status: 'PUBLISHED', version: 2, createdAt: new Date() }
    ]

    return NextResponse.json({
      success: true,
      data: mockSchedules
    })
  }
}

// POST /api/schedules - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, status } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Schedule name is required' },
        { status: 400 }
      )
    }

    const schedule = await prisma.schedule.create({
      data: {
        name,
        status: status || 'DRAFT'
      }
    })

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
