import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/database'

// GET /api/faculty/availability - Get faculty availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facultyId = searchParams.get('facultyId')

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      )
    }

    // Get faculty availability preferences
    const preferences = await prisma.preference.findMany({
      where: {
        userId: facultyId,
        type: 'availability'
      }
    })

    // Parse availability data
    const availability = preferences.length > 0 
      ? JSON.parse(preferences[0].value as string)
      : {}

    return NextResponse.json({
      success: true,
      data: availability
    })
  } catch (error) {
    console.error('Error fetching faculty availability:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculty availability' },
      { status: 500 }
    )
  }
}

// POST /api/faculty/availability - Save faculty availability
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facultyId, availability } = body

    if (!facultyId || !availability) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID and availability data are required' },
        { status: 400 }
      )
    }

    // Save or update availability preference
    const existingPreference = await prisma.preference.findFirst({
      where: {
        userId: facultyId,
        type: 'availability'
      }
    })

    if (existingPreference) {
      await prisma.preference.update({
        where: { id: existingPreference.id },
        data: {
          value: JSON.stringify(availability)
        }
      })
    } else {
      await prisma.preference.create({
        data: {
          userId: facultyId,
          type: 'availability',
          value: JSON.stringify(availability)
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Availability saved successfully'
    })
  } catch (error) {
    console.error('Error saving faculty availability:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save faculty availability' },
      { status: 500 }
    )
  }
}
