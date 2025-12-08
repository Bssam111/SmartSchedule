import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest, requireAdmin } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import { z } from 'zod'

const router = Router()

const assignGradeSchema = z.object({
  assignmentId: z.string(),
  numericGrade: z.number().int().min(0).max(100),
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().optional()
})

/**
 * KSU Grade Scale
 */
const GRADE_SCALE = [
  { min: 95, max: 100, letter: 'A+', points: 5.0 },
  { min: 90, max: 94, letter: 'A', points: 4.75 },
  { min: 85, max: 89, letter: 'B+', points: 4.5 },
  { min: 80, max: 84, letter: 'B', points: 4.0 },
  { min: 75, max: 79, letter: 'C+', points: 3.5 },
  { min: 70, max: 74, letter: 'C', points: 3.0 },
  { min: 65, max: 69, letter: 'D+', points: 2.5 },
  { min: 60, max: 64, letter: 'D', points: 2.0 },
  { min: 0, max: 59, letter: 'F', points: 0.0 }
]

function getLetterGrade(numericGrade: number): { letter: string; points: number } {
  for (const scale of GRADE_SCALE) {
    if (numericGrade >= scale.min && numericGrade <= scale.max) {
      return { letter: scale.letter, points: scale.points }
    }
  }
  return { letter: 'F', points: 0.0 }
}

/**
 * POST /api/grades/assign
 * Assign a grade to a student (Faculty/Admin only)
 */
router.post('/assign', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const data = assignGradeSchema.parse(req.body)
    const userId = req.user?.id

    if (!userId) {
      throw new CustomError('Unauthorized', 401)
    }

    // Get assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      include: {
        section: {
          include: {
            instructor: {
              select: { id: true }
            }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            majorId: true
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        }
      }
    })

    if (!assignment) {
      throw new CustomError('Assignment not found', 404)
    }

    // Verify faculty is the instructor or admin
    if (req.user?.role !== 'ADMIN' && assignment.section.instructor?.id !== userId) {
      throw new CustomError('Only the course instructor can assign grades', 403)
    }

    // Calculate letter grade and points
    const { letter, points } = getLetterGrade(data.numericGrade)

    // Create or update grade
    const grade = await prisma.grade.upsert({
      where: { assignmentId: data.assignmentId },
      create: {
        assignmentId: data.assignmentId,
        studentId: assignment.studentId,
        courseId: assignment.courseId,
        numericGrade: data.numericGrade,
        letterGrade: letter,
        points: points,
        semester: data.semester,
        academicYear: data.academicYear || getCurrentAcademicYear()
      },
      update: {
        numericGrade: data.numericGrade,
        letterGrade: letter,
        points: points,
        semester: data.semester,
        academicYear: data.academicYear || getCurrentAcademicYear()
      }
    })

    // Get or create student progress record
    const studentPlan = await prisma.academicPlan.findFirst({
      where: {
        majorId: assignment.student.majorId || undefined,
        isActive: true
      },
      select: { id: true }
    })

    // ALWAYS update StudentProgress based on grade value
    // Academic plan color depends on grade: green if >= 60, red if < 60
    if (studentPlan) {
      const isPassing = data.numericGrade >= 60
      
      // Update assignment status
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: isPassing ? 'COMPLETED' : 'FAILED' }
      })

      // Update student progress immediately so academic plan shows green/red
      await prisma.studentProgress.upsert({
        where: {
          studentId_courseId: {
            studentId: assignment.studentId,
            courseId: assignment.courseId
          }
        },
        create: {
          studentId: assignment.studentId,
          courseId: assignment.courseId,
          planId: studentPlan.id,
          status: isPassing ? 'COMPLETED' : 'FAILED',
          semesterTaken: grade.semester,
          gradeId: grade.id
        },
        update: {
          status: isPassing ? 'COMPLETED' : 'FAILED',
          semesterTaken: grade.semester,
          gradeId: grade.id
        }
      })
    }

    res.json({
      success: true,
      message: 'Grade assigned successfully',
      data: grade
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/grades/student/:studentId
 * Get student's grades including PN (Pending/Not entered) status
 */
router.get('/student/:studentId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { studentId } = req.params

    // Verify access
    if (req.user?.role === 'STUDENT' && req.user.id !== studentId) {
      throw new CustomError('Unauthorized', 403)
    }

    // Get all grades
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        },
        assignment: {
          include: {
            section: {
              include: {
                instructor: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { semester: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Get all assignments without grades (PN status)
    // These are assignments for closed semesters that don't have grades
    const assignmentsWithoutGrades = await prisma.assignment.findMany({
      where: {
        studentId,
        grade: null,
        status: { in: ['ENROLLED', 'COMPLETED', 'FAILED'] }
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        },
        section: {
          select: {
            id: true,
            name: true,
            instructor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Get student progress to find semester information for assignments
    const studentProgress = await prisma.studentProgress.findMany({
      where: {
        studentId,
        courseId: { in: assignmentsWithoutGrades.map(a => a.courseId) }
      },
      select: {
        courseId: true,
        semesterTaken: true
      }
    })

    // Get closed semesters to match with assignments
    const closedSemesters = await prisma.semester.findMany({
      where: {
        endDate: { not: null, lte: new Date() }
      },
      orderBy: [
        { academicYear: 'desc' },
        { semesterNumber: 'desc' }
      ]
    })

    // Create a map of courseId to semester info from student progress
    const courseToSemester = new Map<string, { semester: number; academicYear: string | null }>()
    for (const progress of studentProgress) {
      if (progress.semesterTaken) {
        // Find the semester that matches this semester number
        // We'll use the most recent closed semester with this number
        const matchingSemester = closedSemesters.find(s => s.semesterNumber === progress.semesterTaken)
        if (matchingSemester) {
          courseToSemester.set(progress.courseId, {
            semester: matchingSemester.semesterNumber,
            academicYear: matchingSemester.academicYear
          })
        }
      }
    }

    // For assignments without progress info, try to match by creation date to closed semesters
    const pnGrades = await Promise.all(assignmentsWithoutGrades.map(async (assignment) => {
      // First try to get semester from student progress
      let semesterInfo = courseToSemester.get(assignment.courseId)
      
      // If not found, try to match by assignment creation date to closed semesters
      if (!semesterInfo) {
        const assignmentDate = assignment.createdAt
        // Find the closed semester that was active when assignment was created
        const matchingSemester = closedSemesters.find(sem => {
          if (!sem.startDate || !sem.endDate) return false
          return assignmentDate >= sem.startDate && assignmentDate <= sem.endDate
        })
        
        if (matchingSemester) {
          semesterInfo = {
            semester: matchingSemester.semesterNumber,
            academicYear: matchingSemester.academicYear
          }
        } else {
          // Fallback: use most recent closed semester
          if (closedSemesters.length > 0) {
            semesterInfo = {
              semester: closedSemesters[0].semesterNumber,
              academicYear: closedSemesters[0].academicYear
            }
          }
        }
      }

      return {
        id: `pn-${assignment.id}`,
        assignmentId: assignment.id,
        studentId: assignment.studentId,
        courseId: assignment.courseId,
        numericGrade: null,
        letterGrade: 'PN',
        points: null,
        semester: semesterInfo?.semester || 0,
        academicYear: semesterInfo?.academicYear || null,
        course: {
          id: assignment.course.id,
          code: assignment.course.code,
          name: assignment.course.name,
          credits: assignment.course.credits
        },
        isPN: true // Flag to identify PN grades
      }
    }))

    // Combine grades and PN entries
    const allGrades = [
      ...grades.map(g => ({ ...g, isPN: false })),
      ...pnGrades
    ]

    // Calculate GPA (only from actual grades, not PN)
    const gpa = calculateGPA(grades)

    res.json({
      success: true,
      data: {
        grades: allGrades,
        gpa
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/grades/semester/:semester
 * Get grades for a specific semester
 */
router.get('/semester/:semester', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const semester = parseInt(req.params.semester, 10)
    const studentId = req.user?.id

    if (!studentId) {
      throw new CustomError('Unauthorized', 401)
    }

    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        semester
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const semesterGPA = calculateSemesterGPA(grades)

    res.json({
      success: true,
      data: {
        grades,
        semesterGPA
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/grades/faculty/all
 * Get all sections with assignments grouped by semester for a faculty member
 */
router.get('/faculty/all', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      throw new CustomError('Unauthorized', 401)
    }

    // Get current semester
    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true }
    })

    // Get all sections for this instructor
    const sections = await prisma.section.findMany({
      where: {
        instructorId: userId
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        },
        assignments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                universityId: true,
                email: true
              }
            },
            grade: true
          },
          orderBy: {
            student: {
              name: 'asc'
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

    // Group sections and assignments by semester
    const grouped: Record<string, {
      semester: { id: string; name: string; academicYear: string; semesterNumber: number } | null
      sections: Array<{
        id: string
        name: string
        course: { id: string; code: string; name: string; credits: number }
        assignments: Array<{
          id: string
          studentId: string
          courseId: string
          student: { id: string; name: string; universityId: string; email: string }
          course: { id: string; code: string; name: string; credits: number }
          section: { id: string; name: string }
          grade?: { id: string; numericGrade: number; letterGrade: string; points: number; semester: number; academicYear: string | null }
        }>
      }>
    }> = {}

    for (const section of sections) {
      // Group assignments by semester (from grade, or use current semester if no grade)
      const assignmentsBySemester: Record<string, Array<{
        id: string
        studentId: string
        courseId: string
        student: { id: string; name: string; universityId: string; email: string }
        course: { id: string; code: string; name: string; credits: number }
        section: { id: string; name: string }
        grade?: { id: string; numericGrade: number; letterGrade: string; points: number; semester: number; academicYear: string | null }
      }>> = {}

      for (const assignment of section.assignments) {
        const semesterKey = assignment.grade
          ? `${assignment.grade.academicYear || 'Unknown'}-${assignment.grade.semester}`
          : currentSemester
            ? `${currentSemester.academicYear}-${currentSemester.semesterNumber}`
            : 'unknown'

        if (!assignmentsBySemester[semesterKey]) {
          assignmentsBySemester[semesterKey] = []
        }
        const assignmentData: {
          id: string
          studentId: string
          courseId: string
          student: { id: string; name: string; universityId: string; email: string }
          course: { id: string; code: string; name: string; credits: number }
          section: { id: string; name: string }
          grade?: { id: string; numericGrade: number; letterGrade: string; points: number; semester: number; academicYear: string | null }
        } = {
          id: assignment.id,
          studentId: assignment.studentId,
          courseId: assignment.courseId,
          student: {
            id: assignment.student.id,
            name: assignment.student.name,
            universityId: assignment.student.universityId || '',
            email: assignment.student.email
          },
          course: section.course,
          section: { id: section.id, name: section.name }
        }
        
        if (assignment.grade) {
          assignmentData.grade = {
            id: assignment.grade.id,
            numericGrade: assignment.grade.numericGrade,
            letterGrade: assignment.grade.letterGrade || '',
            points: assignment.grade.points || 0,
            semester: assignment.grade.semester,
            academicYear: assignment.grade.academicYear
          }
        }
        
        assignmentsBySemester[semesterKey].push(assignmentData)
      }

      // If no assignments, still include the section under current semester
      if (section.assignments.length === 0 && currentSemester) {
        const semesterKey = `${currentSemester.academicYear}-${currentSemester.semesterNumber}`
        if (!assignmentsBySemester[semesterKey]) {
          assignmentsBySemester[semesterKey] = []
        }
      }

      // Add section to appropriate semester groups
      for (const [semesterKey, assignments] of Object.entries(assignmentsBySemester)) {
        if (!grouped[semesterKey]) {
          // Get semester info from grade or use current semester
          const firstAssignment = assignments[0]
          let semesterInfo = null
          
          if (firstAssignment?.grade) {
            // Try to find the semester from the grade
            const semester = await prisma.semester.findFirst({
              where: {
                academicYear: firstAssignment.grade.academicYear || undefined,
                semesterNumber: firstAssignment.grade.semester
              }
            })
            if (semester) {
              semesterInfo = {
                id: semester.id,
                name: semester.name,
                academicYear: semester.academicYear,
                semesterNumber: semester.semesterNumber
              }
            }
          }
          
          if (!semesterInfo && currentSemester) {
            semesterInfo = {
              id: currentSemester.id,
              name: currentSemester.name,
              academicYear: currentSemester.academicYear,
              semesterNumber: currentSemester.semesterNumber
            }
          }

          grouped[semesterKey] = {
            semester: semesterInfo,
            sections: []
          }
        }

        // Check if section already exists in this semester group
        const existingSection = grouped[semesterKey].sections.find(s => s.id === section.id)
        if (!existingSection) {
          grouped[semesterKey].sections.push({
            id: section.id,
            name: section.name,
            course: section.course,
            assignments
          })
        } else {
          // Merge assignments
          existingSection.assignments.push(...assignments)
        }
      }
    }

    res.json({
      success: true,
      data: Object.values(grouped).sort((a, b) => {
        if (!a.semester || !b.semester) return 0
        if (a.semester.academicYear !== b.semester.academicYear) {
          return b.semester.academicYear.localeCompare(a.semester.academicYear)
        }
        return b.semester.semesterNumber - a.semester.semesterNumber
      })
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/grades/section/:sectionId
 * Get all grades for a section (Faculty/Admin only)
 */
router.get('/section/:sectionId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { sectionId } = req.params
    const userId = req.user?.id

    if (!userId) {
      throw new CustomError('Unauthorized', 401)
    }

    // Verify section exists and user is instructor or admin
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        instructor: {
          select: { id: true }
        }
      }
    })

    if (!section) {
      throw new CustomError('Section not found', 404)
    }

    if (req.user?.role !== 'ADMIN' && section.instructor?.id !== userId) {
      throw new CustomError('Unauthorized', 403)
    }

    const assignments = await prisma.assignment.findMany({
      where: { sectionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            universityId: true,
            email: true
          }
        },
        grade: true,
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        },
        section: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        student: {
          name: 'asc'
        }
      }
    })

    res.json({
      success: true,
      data: assignments
    })
  } catch (error) {
    next(error)
  }
})

/**
 * Calculate cumulative GPA
 */
function calculateGPA(grades: Array<{ points: number | null; course: { credits: number } }>): {
  cumulative: number
  totalCredits: number
  totalPoints: number
} {
  let totalPoints = 0
  let totalCredits = 0

  for (const grade of grades) {
    if (grade.points !== null) {
      totalPoints += grade.points * grade.course.credits
      totalCredits += grade.course.credits
    }
  }

  return {
    cumulative: totalCredits > 0 ? totalPoints / totalCredits : 0,
    totalCredits,
    totalPoints
  }
}

/**
 * Calculate semester GPA
 */
function calculateSemesterGPA(grades: Array<{ points: number | null; course: { credits: number } }>): number {
  const gpa = calculateGPA(grades)
  return gpa.cumulative
}

/**
 * Get current academic year
 */
function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Academic year runs from September to August
  if (month >= 9) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

export { router as gradeRoutes }

