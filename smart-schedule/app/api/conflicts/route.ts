import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/database'

// POST /api/conflicts - Check for conflicts before assignment/enrollment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, sectionId, studentId, facultyId, meetings } = body

    if (!type || !sectionId) {
      return NextResponse.json(
        { success: false, error: 'Type and sectionId are required' },
        { status: 400 }
      )
    }

    const conflicts = []

    // Get section details
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        meetings: true,
        instructor: true
      }
    })

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      )
    }

    // Check student conflicts
    if (type === 'enrollment' && studentId) {
      const studentConflicts = await prisma.assignment.findMany({
        where: {
          studentId,
          section: {
            meetings: {
              some: {
                dayOfWeek: {
                  in: section.meetings.map(m => m.dayOfWeek)
                },
                OR: section.meetings.map(meeting => ({
                  AND: [
                    { dayOfWeek: meeting.dayOfWeek },
                    {
                      OR: [
                        {
                          AND: [
                            { startTime: { lte: meeting.startTime } },
                            { endTime: { gt: meeting.startTime } }
                          ]
                        },
                        {
                          AND: [
                            { startTime: { lt: meeting.endTime } },
                            { endTime: { gte: meeting.endTime } }
                          ]
                        }
                      ]
                    }
                  ]
                }))
              }
            }
          }
        },
        include: {
          section: {
            include: {
              course: true,
              meetings: true
            }
          }
        }
      })

      for (const conflict of studentConflicts) {
        for (const conflictMeeting of conflict.section.meetings) {
          for (const sectionMeeting of section.meetings) {
            if (conflictMeeting.dayOfWeek === sectionMeeting.dayOfWeek &&
                ((conflictMeeting.startTime <= sectionMeeting.startTime && conflictMeeting.endTime > sectionMeeting.startTime) ||
                 (conflictMeeting.startTime < sectionMeeting.endTime && conflictMeeting.endTime >= sectionMeeting.endTime))) {
              conflicts.push({
                type: 'student_time_conflict',
                message: `Student has time conflict with ${conflict.section.course.code} - ${conflict.section.course.name}`,
                conflictingCourse: conflict.section.course.code,
                conflictingCourseName: conflict.section.course.name,
                day: conflictMeeting.dayOfWeek,
                time: `${conflictMeeting.startTime}-${conflictMeeting.endTime}`,
                currentCourse: section.course.code,
                currentCourseName: section.course.name
              })
            }
          }
        }
      }
    }

    // Check faculty conflicts
    if (type === 'assignment' && facultyId) {
      const facultyConflicts = await prisma.assignment.findMany({
        where: {
          section: {
            instructorId: facultyId,
            meetings: {
              some: {
                dayOfWeek: {
                  in: section.meetings.map(m => m.dayOfWeek)
                },
                OR: section.meetings.map(meeting => ({
                  AND: [
                    { dayOfWeek: meeting.dayOfWeek },
                    {
                      OR: [
                        {
                          AND: [
                            { startTime: { lte: meeting.startTime } },
                            { endTime: { gt: meeting.startTime } }
                          ]
                        },
                        {
                          AND: [
                            { startTime: { lt: meeting.endTime } },
                            { endTime: { gte: meeting.endTime } }
                          ]
                        }
                      ]
                    }
                  ]
                }))
              }
            }
          }
        },
        include: {
          section: {
            include: {
              course: true,
              meetings: true
            }
          }
        }
      })

      for (const conflict of facultyConflicts) {
        for (const conflictMeeting of conflict.section.meetings) {
          for (const sectionMeeting of section.meetings) {
            if (conflictMeeting.dayOfWeek === sectionMeeting.dayOfWeek &&
                ((conflictMeeting.startTime <= sectionMeeting.startTime && conflictMeeting.endTime > sectionMeeting.startTime) ||
                 (conflictMeeting.startTime < sectionMeeting.endTime && conflictMeeting.endTime >= sectionMeeting.endTime))) {
              conflicts.push({
                type: 'faculty_time_conflict',
                message: `Faculty has time conflict with ${conflict.section.course.code} - ${conflict.section.course.name}`,
                conflictingCourse: conflict.section.course.code,
                conflictingCourseName: conflict.section.course.name,
                day: conflictMeeting.dayOfWeek,
                time: `${conflictMeeting.startTime}-${conflictMeeting.endTime}`,
                currentCourse: section.course.code,
                currentCourseName: section.course.name
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
      message: conflicts.length > 0 ? 'Conflicts detected' : 'No conflicts found'
    })
  } catch (error) {
    console.error('Error checking conflicts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check conflicts' },
      { status: 500 }
    )
  }
}
