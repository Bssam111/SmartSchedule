import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({
        success: false,
        error: 'Student ID is required'
      }, { status: 400 })
    }

    // Mock recommendations
    const recommendations = [
      {
        id: 'rec-1',
        type: 'course',
        title: 'Advanced Algorithms',
        description: 'Based on your CS background and schedule preferences',
        confidence: 0.85,
        reason: 'Fits your CS major requirements and available time slots'
      },
      {
        id: 'rec-2',
        type: 'time',
        title: 'Morning Schedule',
        description: 'Consider morning classes for better focus',
        confidence: 0.72,
        reason: 'Your performance data shows better results in morning sessions'
      },
      {
        id: 'rec-3',
        type: 'elective',
        title: 'Machine Learning',
        description: 'High-demand elective that complements your major',
        confidence: 0.91,
        reason: 'Popular among CS students and aligns with your interests'
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        recommendations,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Recommendations fetch failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recommendations'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, preferences } = body

    // Mock recommendation generation
    const recommendations = [
      {
        id: 'rec-generated-1',
        type: 'schedule',
        title: 'Optimized Schedule',
        description: 'AI-generated schedule based on your preferences',
        confidence: 0.88,
        reason: 'Balances your course requirements with time preferences'
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        recommendations,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Recommendation generation failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Recommendation generation failed'
    }, { status: 500 })
  }
}
