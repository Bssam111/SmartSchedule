import { Router } from 'express'
import { prisma } from '@/config/database'
import { createSectionSchema, updateSectionSchema } from '@/utils/validation'
import { authenticateToken, requireFacultyOrCommittee, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/sections
router.get('/', async (req, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        course: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        course: {
          code: 'asc'
        }
      }
    })

    res.json({
      success: true,
      data: sections
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/sections/:id/enroll - Committee can enroll students (MUST come before /:id route)
router.post('/:id/enroll', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const { studentId, universityId } = req.body

    // Find student by ID or universityId
    let student
    if (studentId) {
      student = await prisma.user.findUnique({
        where: { id: studentId }
      })
    } else if (universityId) {
      student = await prisma.user.findUnique({
        where: { universityId }
      })
    }

    if (!student || student.role !== 'STUDENT') {
      throw new CustomError('Student not found', 404)
    }

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        course: true,
        assignments: true
      }
    })

    if (!section) {
      throw new CustomError('Section not found', 404)
    }

    // Check if student is already enrolled
    const existingAssignment = await prisma.assignment.findUnique({
      where: {
        studentId_sectionId: {
          studentId: student.id,
          sectionId: id
        }
      }
    })

    if (existingAssignment) {
      throw new CustomError('Student already enrolled in this section', 409)
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        studentId: student.id,
        sectionId: id,
        courseId: section.courseId
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            universityId: true
          }
        },
        section: {
          include: {
            course: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: assignment
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/sections/:id/unenroll - Committee can unenroll students (MUST come before /:id route)
router.delete('/:id/unenroll', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const { studentId } = req.query

    if (!studentId || typeof studentId !== 'string') {
      throw new CustomError('Student ID is required', 400)
    }

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id }
    })

    if (!section) {
      throw new CustomError('Section not found', 404)
    }

    // Find and delete assignment
    const assignment = await prisma.assignment.findUnique({
      where: {
        studentId_sectionId: {
          studentId: studentId,
          sectionId: id
        }
      }
    })

    if (!assignment) {
      throw new CustomError('Student is not enrolled in this section', 404)
    }

    await prisma.assignment.delete({
      where: {
        studentId_sectionId: {
          studentId: studentId,
          sectionId: id
        }
      }
    })

    res.json({
      success: true,
      message: 'Student unenrolled successfully'
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/sections/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        course: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        room: true,
        meetings: true,
        assignments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!section) {
      throw new CustomError('Section not found', 404)
    }

    res.json({
      success: true,
      data: section
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/sections
router.post('/', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const sectionData = createSectionSchema.parse(req.body)

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: sectionData.courseId }
    })

    if (!course) {
      throw new CustomError('Course not found', 404)
    }

    // Verify instructor exists and is faculty
    const instructor = await prisma.user.findUnique({
      where: { id: sectionData.instructorId }
    })

    if (!instructor || instructor.role !== 'FACULTY') {
      throw new CustomError('Invalid instructor', 400)
    }

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: sectionData.roomId }
    })

    if (!room) {
      throw new CustomError('Room not found', 404)
    }

    // Create section with meetings
    const section = await prisma.section.create({
      data: {
        name: `${course.code} - Section`,
        courseId: sectionData.courseId,
        instructorId: sectionData.instructorId,
        roomId: sectionData.roomId,
        meetings: {
          create: sectionData.meetings.map(meeting => ({
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime
          }))
        }
      },
      include: {
        course: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        room: true,
        meetings: true
      }
    })

    res.status(201).json({
      success: true,
      message: 'Section created successfully',
      data: section
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/sections/:id
router.put('/:id', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const sectionData = updateSectionSchema.parse(req.body)

    // Check if section exists
    const existingSection = await prisma.section.findUnique({
      where: { id }
    })

    if (!existingSection) {
      throw new CustomError('Section not found', 404)
    }

    // Update section
    const section = await prisma.section.update({
      where: { id },
      data: {
        ...sectionData,
        meetings: sectionData.meetings ? {
          deleteMany: {},
          create: sectionData.meetings.map(meeting => ({
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime
          }))
        } : undefined
      },
      include: {
        course: true,
        instructor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        room: true,
        meetings: true
      }
    })

    res.json({
      success: true,
      message: 'Section updated successfully',
      data: section
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/sections/:id
router.delete('/:id', authenticateToken, requireFacultyOrCommittee, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        assignments: true
      }
    })

    if (!section) {
      throw new CustomError('Section not found', 404)
    }

    // Check if section has assignments
    if (section.assignments.length > 0) {
      throw new CustomError('Cannot delete section with existing assignments', 400)
    }

    await prisma.section.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Section deleted successfully'
    })
  } catch (error) {
    next(error)
  }
})

export { router as sectionRoutes }
