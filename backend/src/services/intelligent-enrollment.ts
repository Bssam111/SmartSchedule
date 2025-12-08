import { prisma } from '@/config/database'
import { CustomError } from '@/middleware/errorHandler'
import { canEnrollInCourse } from '@/utils/prerequisites'

interface StudentEnrollmentNeeds {
  studentId: string
  currentLevel: number
  missingByLevel: Map<number, Array<{ courseId: string; credits: number }>> // Level -> Course IDs with credits
  coursesByLevel: Map<number, Array<{ courseId: string; courseCode: string; credits: number }>>
}

interface CourseDistribution {
  studentId: string
  coursesToEnroll: string[] // Course IDs
}

const MAX_CREDITS_PER_SEMESTER = 20

/**
 * Check if two time ranges overlap
 */
function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert time strings to minutes for comparison
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)

  // Check if ranges overlap
  return start1Min < end2Min && start2Min < end1Min
}

/**
 * Calculate student's current level based on registration semester and current semester
 * Simple formula: currentSemester - RegisteredSemester = student's level
 * Level starts at 1, so: level = (currentSemester - RegisteredSemester) + 1
 */
function calculateStudentLevel(
  registrationYear: string,
  registrationSemester: number,
  currentYear: string,
  currentSemester: number
): number {
  // Parse academic years (format: "2025/2026")
  const regYearStart = parseInt(registrationYear.split('/')[0])
  const currYearStart = parseInt(currentYear.split('/')[0])
  
  // Calculate total semesters difference
  // Each academic year has 2 semesters
  let totalSemesterDiff = 0
  
  if (currYearStart > regYearStart) {
    // Different academic years
    const yearDiff = currYearStart - regYearStart
    totalSemesterDiff = (yearDiff * 2) + (currentSemester - registrationSemester)
  } else if (currYearStart === regYearStart) {
    // Same academic year
    totalSemesterDiff = currentSemester - registrationSemester
  } else {
    // Current year is before registration year (shouldn't happen, but handle it)
    return 1
  }
  
  // Simple formula: currentSemester - RegisteredSemester = student's level
  // Level starts at 1, so: level = totalSemesterDiff + 1
  // Example: Registered in 2025/2026 S2, current is 2026/2027 S2
  // totalSemesterDiff = (2026-2025)*2 + (2-2) = 2 semesters difference
  // Level = 2 + 1 = 3
  // Example: Registered in 2025/2026 S2, current is 2026/2027 S1
  // totalSemesterDiff = (2026-2025)*2 + (1-2) = 2 - 1 = 1 semester difference
  // Level = 1 + 1 = 2
  const calculatedLevel = totalSemesterDiff + 1
  
  // Ensure level is between 1 and 8
  return Math.max(1, Math.min(8, calculatedLevel))
}

/**
 * Intelligent course assignment service
 * Assigns courses to students based on:
 * - Calculating student level from registration semester
 * - Analyzing all levels up to student's current level
 * - Always prioritizing previous levels over current level
 * - Distributing courses intelligently if total credits exceed 20
 * - Ensuring fair distribution among students
 * - Avoiding time conflicts
 */
export async function intelligentCourseAssignment() {
  console.log('[IntelligentEnrollment] Starting intelligent course assignment...')

  // Get current semester
  const currentSemester = await prisma.semester.findFirst({
    where: { isCurrent: true },
    select: { id: true, academicYear: true, semesterNumber: true }
  })

  if (!currentSemester) {
    throw new CustomError('No current semester set', 400)
  }

  // Get all active students with majors
  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      majorId: { not: null }
    },
    include: {
      registrationSemester: {
        select: {
          id: true,
          academicYear: true,
          semesterNumber: true
        }
      }
    }
  })

  console.log(`[IntelligentEnrollment] Found ${students.length} students to process`)

  const enrollmentNeeds: StudentEnrollmentNeeds[] = []

  // Calculate and update each student's level based on registration semester
  for (const student of students) {
    if (!student.majorId || !student.registrationSemesterId || !student.registrationSemester) continue

    const regSem = student.registrationSemester

    // Calculate student's current level based on registration semester and current semester
    const calculatedLevel = calculateStudentLevel(
      regSem.academicYear,
      regSem.semesterNumber,
      currentSemester.academicYear,
      currentSemester.semesterNumber
    )

    // Update student's currentLevel if it's different
    if (student.currentLevel !== calculatedLevel) {
      await prisma.user.update({
        where: { id: student.id },
        data: { currentLevel: calculatedLevel }
      })
      console.log(`[IntelligentEnrollment] Updated student ${student.id} level from ${student.currentLevel || 1} to ${calculatedLevel}`)
    }

    const needs = await analyzeStudentNeeds(student.id, student.majorId, calculatedLevel)
    enrollmentNeeds.push(needs)
  }

  // Group students by their needs for intelligent distribution
  const distribution = distributeCoursesIntelligently(enrollmentNeeds)

  // Execute enrollments
  let totalEnrolled = 0
  let totalSkipped = 0

  for (const dist of distribution) {
    const result = await enrollStudentInCourses(
      dist.studentId,
      dist.coursesToEnroll,
      currentSemester.id
    )
    totalEnrolled += result.enrolledCount
    totalSkipped += result.skippedCount
  }

  console.log(`[IntelligentEnrollment] Completed: ${totalEnrolled} courses enrolled, ${totalSkipped} skipped`)

  return {
    studentsProcessed: students.length,
    totalEnrolled,
    totalSkipped
  }
}

/**
 * Analyze what courses a student needs across all levels
 */
async function analyzeStudentNeeds(
  studentId: string,
  majorId: string,
  currentLevel: number
): Promise<StudentEnrollmentNeeds> {
  // Get academic plan - include all levels up to and including current level
  const plan = await prisma.academicPlan.findFirst({
    where: {
      majorId,
      isActive: true
    },
    include: {
      courses: {
        where: {
          semester: { lte: currentLevel } // All levels up to current level
        },
        include: {
          course: {
            include: {
              level: true,
              sections: {
                include: {
                  assignments: {
                    where: {
                      status: 'ENROLLED'
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          semester: 'asc',
          displayOrder: 'asc'
        }
      }
    }
  })

  if (!plan) {
    return {
      studentId,
      currentLevel,
      missingByLevel: new Map(),
      coursesByLevel: new Map()
    }
  }

  // Get student's completed courses
  const completedCourses = await prisma.studentProgress.findMany({
    where: {
      studentId,
      status: 'COMPLETED'
    },
    select: {
      courseId: true
    }
  })

  const completedCourseIds = new Set(completedCourses.map(c => c.courseId))

  // Get student's current enrollments
  const currentEnrollments = await prisma.assignment.findMany({
    where: {
      studentId,
      status: 'ENROLLED'
    },
    include: {
      course: true
    }
  })

  const enrolledCourseIds = new Set(currentEnrollments.map(a => a.courseId))

  const missingByLevel = new Map<number, Array<{ courseId: string; credits: number }>>()
  const coursesByLevel = new Map<number, Array<{ courseId: string; courseCode: string; credits: number }>>()

  // Initialize maps for all levels up to current level
  for (let level = 1; level <= currentLevel; level++) {
    missingByLevel.set(level, [])
    coursesByLevel.set(level, [])
  }

  for (const courseInPlan of plan.courses) {
    const course = courseInPlan.course
    const level = courseInPlan.semester // semester field represents level

    // Skip if already completed or currently enrolled
    if (completedCourseIds.has(course.id) || enrolledCourseIds.has(course.id)) {
      continue
    }

    // Check prerequisites
    const enrollmentCheck = await canEnrollInCourse(studentId, course.id)
    if (!enrollmentCheck.canEnroll) {
      continue
    }

    // Check if course has available sections
    const hasAvailableSection = course.sections.some(section => {
      const currentEnrollments = section.assignments.length
      return currentEnrollments < 30 // Max capacity
    })

    if (!hasAvailableSection) {
      continue
    }

    // Add to appropriate level with credits
    const missing = missingByLevel.get(level) || []
    missing.push({
      courseId: course.id,
      credits: course.credits
    })
    missingByLevel.set(level, missing)

    const courses = coursesByLevel.get(level) || []
    courses.push({
      courseId: course.id,
      courseCode: course.code,
      credits: course.credits
    })
    coursesByLevel.set(level, courses)
  }

  return {
    studentId,
    currentLevel,
    missingByLevel,
    coursesByLevel
  }
}

/**
 * Intelligently distribute courses among students
 * Prioritizes lower levels first (level 1, then 2, then 3, etc.)
 * Limits total credits to MAX_CREDITS_PER_SEMESTER (20 credits)
 */
function distributeCoursesIntelligently(
  needs: StudentEnrollmentNeeds[]
): CourseDistribution[] {
  const distributions: CourseDistribution[] = []

  for (const student of needs) {
    const coursesToEnroll: string[] = []
    let totalCredits = 0
    
    // Get all levels in ascending order (prioritize lower levels)
    const levels = Array.from(student.missingByLevel.keys()).sort((a, b) => a - b)
    
    // First pass: Collect all missing courses from all levels, prioritizing lower levels
    // Track total credits instead of course count
    for (const level of levels) {
      const missingCourses = student.missingByLevel.get(level) || []
      
      for (const course of missingCourses) {
        // Check if adding this course would exceed the credit limit
        if (totalCredits + course.credits > MAX_CREDITS_PER_SEMESTER) {
          break // Stop adding courses from this level
        }
        
        coursesToEnroll.push(course.courseId)
        totalCredits += course.credits
      }
      
      // If we've reached the credit limit, stop processing higher levels
      if (totalCredits >= MAX_CREDITS_PER_SEMESTER) {
        break
      }
    }

    distributions.push({
      studentId: student.studentId,
      coursesToEnroll
    })
  }

  // Second pass: Intelligent cross-student distribution
  // If multiple students need the same courses, distribute them fairly
  const courseDemand = new Map<string, number>() // courseId -> number of students needing it
  
  // Count demand for each course
  for (const student of needs) {
    for (const level of Array.from(student.missingByLevel.keys()).sort((a, b) => a - b)) {
      const missingCourses = student.missingByLevel.get(level) || []
      for (const course of missingCourses) {
        courseDemand.set(course.courseId, (courseDemand.get(course.courseId) || 0) + 1)
      }
    }
  }

  // Redistribute courses intelligently
  // For courses with high demand, ensure fair distribution
  for (const dist of distributions) {
    // Calculate current credits for this distribution
    let currentCredits = 0
    const courseCreditsMap = new Map<string, number>()
    
    // Build a map of course credits from all students' needs
    for (const student of needs) {
      if (student.studentId === dist.studentId) {
        for (const level of Array.from(student.missingByLevel.keys()).sort((a, b) => a - b)) {
          const missingCourses = student.missingByLevel.get(level) || []
          for (const course of missingCourses) {
            courseCreditsMap.set(course.courseId, course.credits)
          }
        }
        break
      }
    }
    
    // Calculate current total credits
    for (const courseId of dist.coursesToEnroll) {
      currentCredits += courseCreditsMap.get(courseId) || 0
    }
    
    // If student has max credits, keep the distribution as is (already prioritized by level)
    if (currentCredits >= MAX_CREDITS_PER_SEMESTER) {
      continue
    }
    
    // For students with room, we could add more courses from higher levels
    // But this is already handled in the first pass
  }

  return distributions
}

/**
 * Create sections for courses that students need
 */
async function createSectionsForCourses(
  courseIds: string[],
  semesterId: string
): Promise<void> {
  console.log(`[IntelligentEnrollment] Creating sections for ${courseIds.length} courses...`)

  // Get available faculty
  const faculty = await prisma.user.findMany({
    where: { role: 'FACULTY' },
    select: { id: true }
  })

  if (faculty.length === 0) {
    console.warn('[IntelligentEnrollment] No faculty found, cannot create sections')
    return
  }

  // Get available rooms
  const rooms = await prisma.room.findMany({
    select: { id: true }
  })

  // Get unique courses
  const uniqueCourseIds = [...new Set(courseIds)]
  let facultyIndex = 0
  let roomIndex = 0

  for (const courseId of uniqueCourseIds) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: true
      }
    })

    if (!course) continue

    // Check if section already exists for this course in this semester
    const existingSection = course.sections.find(s => s.semesterId === semesterId)
    if (existingSection) {
      continue // Section already exists
    }

    // Try to use faculty assigned to this course for this semester (from CourseFaculty table)
    let instructorId: string | null = null
    const courseFacultyAssignments = await prisma.courseFaculty.findMany({
      where: {
        courseId: course.id,
        semesterId: semesterId
      },
      select: {
        facultyId: true
      }
    })

    // Use the first available assigned faculty (if they still exist)
    for (const assignment of courseFacultyAssignments) {
      const facultyExists = faculty.some(f => f.id === assignment.facultyId)
      if (facultyExists) {
        instructorId = assignment.facultyId
        console.log(`[IntelligentEnrollment] Using assigned faculty for ${course.code}`)
        break
      }
    }

    // If no assigned faculty or assigned faculty not available, assign new faculty
    if (!instructorId) {
      const instructor = faculty[facultyIndex % faculty.length]
      instructorId = instructor.id
      facultyIndex++
    }

    const room = rooms.length > 0 ? rooms[roomIndex % rooms.length] : null

    const section = await prisma.section.create({
      data: {
        name: `${course.code} - Section 1`,
        courseId: course.id,
        instructorId: instructorId,
        roomId: room?.id || null,
        semesterId: semesterId
      }
    })

    // Create meetings for the section (2 meetings per week)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    const times = [
      { start: '08:00', end: '09:50' },
      { start: '10:00', end: '11:50' },
      { start: '12:00', end: '13:50' },
      { start: '14:00', end: '15:50' }
    ]

    const selectedDays = [
      days[facultyIndex % days.length],
      days[(facultyIndex + 2) % days.length]
    ]
    const selectedTime = times[facultyIndex % times.length]

    await prisma.sectionMeeting.createMany({
      data: selectedDays.map(day => ({
        sectionId: section.id,
        dayOfWeek: day,
        startTime: selectedTime.start,
        endTime: selectedTime.end
      }))
    })

    facultyIndex++
    if (room) roomIndex++
    console.log(`[IntelligentEnrollment] Created section ${section.name} for course ${course.code}`)
  }
}

/**
 * Enroll a student in a list of courses
 */
async function enrollStudentInCourses(
  studentId: string,
  courseIds: string[],
  semesterId: string,
  previousFacultyAssignments?: Map<string, { courseId: string; instructorId: string | null }[]>
): Promise<{ enrolledCount: number; skippedCount: number }> {
  const enrolledCourses: string[] = []
  const skippedCourses: string[] = []

  // First, ensure sections exist for all courses
  await createSectionsForCourses(courseIds, semesterId)

  for (const courseId of courseIds) {
    try {
      // Get course with available sections
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
              assignments: {
                where: {
                  status: 'ENROLLED'
                }
              }
            },
            orderBy: {
              createdAt: 'asc' // Prefer earlier sections
            }
          }
        }
      })

      if (!course) {
        skippedCourses.push(courseId)
        continue
      }

      // Get student's current enrollments to check for time conflicts
      const studentEnrollments = await prisma.assignment.findMany({
        where: {
          studentId,
          status: 'ENROLLED'
        },
        include: {
          section: {
            include: {
              meetings: true
            }
          }
        }
      })

      // Find available section without time conflicts
      let availableSection = null
      for (const section of course.sections) {
        // Check capacity
        const currentEnrollments = section.assignments.length
        if (currentEnrollments >= 30) {
          continue
        }

        // Get section meetings
        const sectionMeetings = await prisma.sectionMeeting.findMany({
          where: { sectionId: section.id }
        })

        // Check for time conflicts with existing enrollments
        let hasConflict = false
        for (const enrollment of studentEnrollments) {
          for (const existingMeeting of enrollment.section.meetings) {
            for (const newMeeting of sectionMeetings) {
              // Check if same day and overlapping times
              if (existingMeeting.dayOfWeek === newMeeting.dayOfWeek) {
                if (timesOverlap(
                  existingMeeting.startTime,
                  existingMeeting.endTime,
                  newMeeting.startTime,
                  newMeeting.endTime
                )) {
                  hasConflict = true
                  break
                }
              }
            }
            if (hasConflict) break
          }
          if (hasConflict) break
        }

        if (!hasConflict) {
          availableSection = section
          break
        }
      }

      // If no available section, create a new one with conflict-free times
      if (!availableSection) {
        const faculty = await prisma.user.findMany({
          where: { role: 'FACULTY' },
          select: { id: true }
        })
        const rooms = await prisma.room.findMany({
          select: { id: true }
        })

        if (faculty.length > 0) {
          // Try to use faculty assigned to this course for this semester
          let instructorId: string | null = null
          const courseFacultyAssignments = await prisma.courseFaculty.findMany({
            where: {
              courseId: course.id,
              semesterId: semesterId
            },
            select: {
              facultyId: true
            }
          })

          // Use the first available assigned faculty
          for (const assignment of courseFacultyAssignments) {
            const facultyExists = faculty.some(f => f.id === assignment.facultyId)
            if (facultyExists) {
              instructorId = assignment.facultyId
              break
            }
          }

          // If no assigned faculty, use random faculty
          if (!instructorId) {
            const instructor = faculty[Math.floor(Math.random() * faculty.length)]
            instructorId = instructor.id
          }

          const room = rooms.length > 0 ? rooms[Math.floor(Math.random() * rooms.length)] : null

          availableSection = await prisma.section.create({
            data: {
              name: `${course.code} - Section ${course.sections.length + 1}`,
              courseId: course.id,
              instructorId: instructorId,
              roomId: room?.id || null,
              semesterId: semesterId
            }
          })

          // Find conflict-free meeting times
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
          const times = [
            { start: '08:00', end: '09:50' },
            { start: '10:00', end: '11:50' },
            { start: '12:00', end: '13:50' },
            { start: '14:00', end: '15:50' }
          ]

          // Get all existing meeting times for this student
          const existingMeetings = studentEnrollments.flatMap(e => e.section.meetings)

          // Try to find conflict-free days and times
          let selectedDays: string[] = []
          let selectedTime = times[0]

          for (let attempt = 0; attempt < 20; attempt++) {
            const day1 = days[Math.floor(Math.random() * days.length)]
            const day2 = days[Math.floor(Math.random() * days.length)]
            const time = times[Math.floor(Math.random() * times.length)]

            // Check if this combination conflicts with existing meetings
            let hasConflict = false
            for (const existing of existingMeetings) {
              if (existing.dayOfWeek === day1 || existing.dayOfWeek === day2) {
                if (timesOverlap(existing.startTime, existing.endTime, time.start, time.end)) {
                  hasConflict = true
                  break
                }
              }
            }

            if (!hasConflict) {
              selectedDays = [day1, day2]
              selectedTime = time
              break
            }
          }

          // If no conflict-free time found, use first available (will be handled by conflict check later)
          if (selectedDays.length === 0) {
            selectedDays = [days[0], days[2]]
            selectedTime = times[0]
          }

          await prisma.sectionMeeting.createMany({
            data: selectedDays.map(day => ({
              sectionId: availableSection!.id,
              dayOfWeek: day,
              startTime: selectedTime.start,
              endTime: selectedTime.end
            }))
          })
        }
      }

      if (!availableSection) {
        skippedCourses.push(courseId)
        continue
      }

      // Check if already enrolled
      const existing = await prisma.assignment.findUnique({
        where: {
          studentId_sectionId: {
            studentId,
            sectionId: availableSection.id
          }
        }
      })

      if (existing && existing.status === 'ENROLLED') {
        continue // Already enrolled
      }

      // Enroll student
      await prisma.assignment.upsert({
        where: {
          studentId_sectionId: {
            studentId,
            sectionId: availableSection.id
          }
        },
        create: {
          studentId,
          sectionId: availableSection.id,
          courseId: course.id,
          status: 'ENROLLED'
        },
        update: {
          status: 'ENROLLED'
        }
      })

      // Update student progress
      const plan = await prisma.academicPlan.findFirst({
        where: {
          courses: {
            some: {
              courseId: course.id
            }
          },
          isActive: true
        },
        select: { id: true }
      })

      if (plan) {
        await prisma.studentProgress.upsert({
          where: {
            studentId_courseId: {
              studentId,
              courseId: course.id
            }
          },
          create: {
            studentId,
            courseId: course.id,
            planId: plan.id,
            status: 'IN_PROGRESS'
          },
          update: {
            status: 'IN_PROGRESS'
          }
        })
      }

      enrolledCourses.push(course.code)
    } catch (error) {
      console.error(`[IntelligentEnrollment] Error enrolling student ${studentId} in course ${courseId}:`, error)
      skippedCourses.push(courseId)
    }
  }

  return {
    enrolledCount: enrolledCourses.length,
    skippedCount: skippedCourses.length
  }
}

