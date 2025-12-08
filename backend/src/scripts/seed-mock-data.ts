import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting mock data seeding...')

  // 1. Get or create SWE major
  const sweMajor = await prisma.major.findUnique({
    where: { code: 'SWE' }
  })

  if (!sweMajor) {
    console.log('❌ SWE major not found. Please run seed-swe-plan.ts first.')
    process.exit(1)
  }

  // 2. Create academic year semesters
  console.log('📅 Creating semesters...')
  const semesters = [
    { academicYear: '2024/2025', semesterNumber: 1, name: '2024/2025 Semester 1', isCurrent: false },
    { academicYear: '2024/2025', semesterNumber: 2, name: '2024/2025 Semester 2', isCurrent: false },
    { academicYear: '2025/2026', semesterNumber: 1, name: '2025/2026 Semester 1', isCurrent: true },
    { academicYear: '2025/2026', semesterNumber: 2, name: '2025/2026 Semester 2', isCurrent: false }
  ]

  const createdSemesters = []
  for (const sem of semesters) {
    const existing = await prisma.semester.findUnique({
      where: {
        academicYear_semesterNumber: {
          academicYear: sem.academicYear,
          semesterNumber: sem.semesterNumber
        }
      }
    })

    if (!existing) {
      const created = await prisma.semester.create({ data: sem })
      createdSemesters.push(created)
      console.log(`✅ Created semester: ${created.name}`)
    } else {
      // Update if exists
      const updated = await prisma.semester.update({
        where: { id: existing.id },
        data: { isCurrent: sem.isCurrent }
      })
      createdSemesters.push(updated)
      console.log(`✅ Updated semester: ${updated.name}`)
    }
  }

  const currentSemester = createdSemesters.find(s => s.isCurrent) || createdSemesters[2]

  // 3. Create faculty members (more faculty for better distribution)
  console.log('👨‍🏫 Creating faculty members...')
  const facultyData = [
    { name: 'Dr. Ahmed Al-Mansouri', email: 'ahmed.almansouri@ksu.edu.sa', universityId: 'FAC0001' },
    { name: 'Dr. Fatima Al-Zahra', email: 'fatima.alzahra@ksu.edu.sa', universityId: 'FAC0002' },
    { name: 'Dr. Mohammed Al-Saud', email: 'mohammed.alsaud@ksu.edu.sa', universityId: 'FAC0003' },
    { name: 'Dr. Sara Al-Rashid', email: 'sara.alrashid@ksu.edu.sa', universityId: 'FAC0004' },
    { name: 'Dr. Khalid Al-Otaibi', email: 'khalid.alotaibi@ksu.edu.sa', universityId: 'FAC0005' },
    { name: 'Dr. Layla Al-Hashimi', email: 'layla.alhashimi@ksu.edu.sa', universityId: 'FAC0006' },
    { name: 'Dr. Omar Al-Dosari', email: 'omar.aldosari@ksu.edu.sa', universityId: 'FAC0007' },
    { name: 'Dr. Nouf Al-Shammari', email: 'nouf.alshammari@ksu.edu.sa', universityId: 'FAC0008' },
    { name: 'Dr. Faisal Al-Qahtani', email: 'faisal.alqahtani@ksu.edu.sa', universityId: 'FAC0009' },
    { name: 'Dr. Hala Al-Mutairi', email: 'hala.almutairi@ksu.edu.sa', universityId: 'FAC0010' },
    { name: 'Dr. Yasser Al-Ghamdi', email: 'yasser.alghamdi@ksu.edu.sa', universityId: 'FAC0011' },
    { name: 'Dr. Reem Al-Shehri', email: 'reem.alshehri@ksu.edu.sa', universityId: 'FAC0012' },
    { name: 'Dr. Majed Al-Harbi', email: 'majed.alharbi@ksu.edu.sa', universityId: 'FAC0013' },
    { name: 'Dr. Amal Al-Zahrani', email: 'amal.alzahrani@ksu.edu.sa', universityId: 'FAC0014' },
    { name: 'Dr. Turki Al-Anazi', email: 'turki.alanazi@ksu.edu.sa', universityId: 'FAC0015' }
  ]

  const faculty = []
  const passwordHash = await bcrypt.hash('Faculty123!@#', 12)
  for (const fac of facultyData) {
    const existing = await prisma.user.findUnique({
      where: { email: fac.email }
    })

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          ...fac,
          password: passwordHash,
          role: 'FACULTY'
        }
      })
      faculty.push(created)
      console.log(`✅ Created faculty: ${created.name}`)
    } else {
      faculty.push(existing)
      console.log(`ℹ️  Faculty already exists: ${existing.name}`)
    }
  }

  // 4. Create committee members
  console.log('👥 Creating committee members...')
  const committeeData = [
    { name: 'Dr. Abdullah Al-Mutairi', email: 'abdullah.almutairi@ksu.edu.sa', universityId: 'COM0001' },
    { name: 'Dr. Noura Al-Harbi', email: 'noura.alharbi@ksu.edu.sa', universityId: 'COM0002' }
  ]

  const committee = []
  for (const comm of committeeData) {
    const existing = await prisma.user.findUnique({
      where: { email: comm.email }
    })

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          ...comm,
          password: passwordHash,
          role: 'COMMITTEE'
        }
      })
      committee.push(created)
      console.log(`✅ Created committee member: ${created.name}`)
    } else {
      committee.push(existing)
      console.log(`ℹ️  Committee member already exists: ${existing.name}`)
    }
  }

  // 5. Get SWE academic plan and courses for multiple levels
  const swePlan = await prisma.academicPlan.findFirst({
    where: {
      majorId: sweMajor.id,
      isActive: true
    },
    include: {
      courses: {
        where: { semester: { lte: 4 } }, // Get courses for levels 1-4
        include: {
          course: {
            include: {
              sections: true
            }
          }
        },
        orderBy: [
          { semester: 'asc' },
          { displayOrder: 'asc' }
        ]
      }
    }
  })

  if (!swePlan) {
    console.log('❌ SWE academic plan not found. Please run seed-swe-plan.ts first.')
    process.exit(1)
  }

  // Group courses by level (semester)
  const coursesByLevel = new Map<number, typeof swePlan.courses>()
  swePlan.courses.forEach(cip => {
    const level = cip.semester
    if (!coursesByLevel.has(level)) {
      coursesByLevel.set(level, [])
    }
    coursesByLevel.get(level)!.push(cip)
  })

  // 6. Create course-faculty assignments for current semester
  console.log('👨‍🏫 Creating course-faculty assignments...')
  const allCourses = swePlan.courses.map(cip => cip.course)
  
  // Assign multiple faculty to each course (2-3 faculty per course for variety)
  for (const course of allCourses) {
    // Assign 2-3 random faculty to each course
    const numFacultyPerCourse = 2 + Math.floor(Math.random() * 2) // 2 or 3
    const shuffledFaculty = [...faculty].sort(() => Math.random() - 0.5)
    const assignedFaculty = shuffledFaculty.slice(0, numFacultyPerCourse)
    
    for (const fac of assignedFaculty) {
      // Check if assignment already exists
      const existing = await prisma.courseFaculty.findUnique({
        where: {
          courseId_facultyId_semesterId: {
            courseId: course.id,
            facultyId: fac.id,
            semesterId: currentSemester.id
          }
        }
      })
      
      if (!existing) {
        await prisma.courseFaculty.create({
          data: {
            courseId: course.id,
            facultyId: fac.id,
            semesterId: currentSemester.id
          }
        })
        console.log(`✅ Assigned ${fac.name} to ${course.code}`)
      }
    }
  }
  console.log('✅ Course-faculty assignments created')

  // 7. Create sections for courses in levels 1-4
  console.log('📚 Creating sections for courses in levels 1-4...')
  const rooms = await prisma.room.findMany({ take: 5 })
  
  if (rooms.length === 0) {
    // Create some rooms
    const roomNames = ['Room 101', 'Room 102', 'Room 201', 'Room 202', 'Room 301']
    for (const roomName of roomNames) {
      await prisma.room.create({
        data: {
          name: roomName,
          capacity: 40,
          location: 'Building A'
        }
      })
    }
    const updatedRooms = await prisma.room.findMany({ take: 5 })
    rooms.push(...updatedRooms)
  }

  const sections = []
  let courseIndex = 0
  // Create sections for each level
  for (let level = 1; level <= 4; level++) {
    const levelCourses = coursesByLevel.get(level) || []
    console.log(`📚 Creating sections for Level ${level} (${levelCourses.length} courses)...`)
    
    for (let i = 0; i < levelCourses.length; i++) {
      const course = levelCourses[i].course
      
      // Get assigned faculty for this course from CourseFaculty table
      const courseFacultyAssignments = await prisma.courseFaculty.findMany({
        where: {
          courseId: course.id,
          semesterId: currentSemester.id
        },
        include: {
          faculty: true
        }
      })
      
      // Use assigned faculty if available, otherwise fall back to round-robin
      let instructor: typeof faculty[0]
      if (courseFacultyAssignments.length > 0) {
        // Use the first assigned faculty (or randomly pick one)
        const randomIndex = Math.floor(Math.random() * courseFacultyAssignments.length)
        instructor = courseFacultyAssignments[randomIndex].faculty
      } else {
        // Fallback to round-robin if no assignments
        instructor = faculty[i % faculty.length]
      }
      
      const room = rooms[i % rooms.length]

    // Check if section already exists for this course in this semester
    const existingSection = await prisma.section.findFirst({
      where: {
        courseId: course.id,
        semesterId: currentSemester.id
      }
    })

    if (!existingSection) {
      // Create section with meetings
      const section = await prisma.section.create({
        data: {
          name: `${course.code}-001`,
          courseId: course.id,
          instructorId: instructor.id,
          roomId: room.id,
          semesterId: currentSemester.id,
          meetings: {
            create: [
              // Most courses meet twice a week
              {
                dayOfWeek: i % 2 === 0 ? 'Sunday' : 'Monday',
                startTime: `${8 + (i % 3)}:00`,
                endTime: `${8 + (i % 3) + 1}:50`
              },
              {
                dayOfWeek: i % 2 === 0 ? 'Wednesday' : 'Tuesday',
                startTime: `${8 + (i % 3)}:00`,
                endTime: `${8 + (i % 3) + 1}:50`
              }
            ]
          }
        },
        include: {
          meetings: true
        }
      })
      sections.push(section)
      console.log(`✅ Created section: ${section.name} for ${course.code} with ${section.meetings.length} meetings`)
    } else {
      // Check if existing section has meetings, if not, add them
      const meetings = await prisma.sectionMeeting.findMany({
        where: { sectionId: existingSection.id }
      })
      
      if (meetings.length === 0) {
        // Add meetings to existing section
        await prisma.sectionMeeting.createMany({
          data: [
            {
              sectionId: existingSection.id,
              dayOfWeek: i % 2 === 0 ? 'Sunday' : 'Monday',
              startTime: `${8 + (i % 3)}:00`,
              endTime: `${8 + (i % 3) + 1}:50`
            },
            {
              sectionId: existingSection.id,
              dayOfWeek: i % 2 === 0 ? 'Wednesday' : 'Tuesday',
              startTime: `${8 + (i % 3)}:00`,
              endTime: `${8 + (i % 3) + 1}:50`
            }
          ]
        })
        console.log(`✅ Added meetings to existing section: ${existingSection.name}`)
      }
      
      sections.push(existingSection)
      console.log(`ℹ️  Section already exists: ${existingSection.name}`)
    }
    courseIndex++
    }
  }

  // 8. Create students registered in different semesters
  console.log('👨‍🎓 Creating students...')
  const studentPasswordHash = await bcrypt.hash('Student123!@#', 12)
  const students = []

  // Students registered in 2024/2025 Semester 1
  const sem1 = createdSemesters[0]
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student.sem1.${i}@ksu.edu.sa` },
      update: {},
      create: {
        name: `Student Sem1-${i}`,
        email: `student.sem1.${i}@ksu.edu.sa`,
        password: studentPasswordHash,
        role: 'STUDENT',
        universityId: `STU100${i}`,
        majorId: sweMajor.id,
        currentLevel: 2, // Level 2 (registered 2 semesters ago)
        registrationSemesterId: sem1.id
      }
    })
    students.push(student)
    console.log(`✅ Created student: ${student.name} (registered in ${sem1.name}, Level 2)`)
  }

  // Students registered in 2024/2025 Semester 2
  const sem2 = createdSemesters[1]
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student.sem2.${i}@ksu.edu.sa` },
      update: {},
      create: {
        name: `Student Sem2-${i}`,
        email: `student.sem2.${i}@ksu.edu.sa`,
        password: studentPasswordHash,
        role: 'STUDENT',
        universityId: `STU200${i}`,
        majorId: sweMajor.id,
        currentLevel: 2, // Level 2 (registered 1.5 semesters ago)
        registrationSemesterId: sem2.id
      }
    })
    students.push(student)
    console.log(`✅ Created student: ${student.name} (registered in ${sem2.name}, Level 2)`)
  }

  // Students registered in current semester (2025/2026 Semester 1)
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student.current.${i}@ksu.edu.sa` },
      update: {},
      create: {
        name: `Student Current-${i}`,
        email: `student.current.${i}@ksu.edu.sa`,
        password: studentPasswordHash,
        role: 'STUDENT',
        universityId: `STU300${i}`,
        majorId: sweMajor.id,
        currentLevel: 1,
        registrationSemesterId: currentSemester.id
      }
    })
    students.push(student)
    console.log(`✅ Created student: ${student.name} (registered in ${currentSemester.name}, Level 1)`)
  }

  // Students registered in 2025/2026 Semester 2 (should be in Level 1, but will advance)
  const sem4 = createdSemesters[3]
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student.sem4.${i}@ksu.edu.sa` },
      update: {},
      create: {
        name: `Student Sem4-${i}`,
        email: `student.sem4.${i}@ksu.edu.sa`,
        password: studentPasswordHash,
        role: 'STUDENT',
        universityId: `STU400${i}`,
        majorId: sweMajor.id,
        currentLevel: 1, // Level 1 (just registered)
        registrationSemesterId: sem4.id
      }
    })
    students.push(student)
    console.log(`✅ Created student: ${student.name} (registered in ${sem4.name}, Level 1)`)
  }

  // 8. Auto-enroll students in courses based on their level
  // Distribute students across different sections to avoid all having the same faculty
  console.log('📝 Enrolling students in courses based on their level...')
  
  // Group sections by course
  const sectionsByCourse = new Map<string, typeof sections>()
  for (const section of sections) {
    if (!sectionsByCourse.has(section.courseId)) {
      sectionsByCourse.set(section.courseId, [])
    }
    sectionsByCourse.get(section.courseId)!.push(section)
  }

  // Enroll each student in courses from their level and previous levels
  for (let studentIndex = 0; studentIndex < students.length; studentIndex++) {
    const student = students[studentIndex]
    const studentLevel = student.currentLevel || 1
    
    // Get courses for this student's level and previous levels
    const coursesToEnroll: Array<{ course: typeof swePlan.courses[0]['course']; level: number }> = []
    for (let level = 1; level <= studentLevel; level++) {
      const levelCourses = coursesByLevel.get(level) || []
      levelCourses.forEach(cip => {
        coursesToEnroll.push({ course: cip.course, level })
      })
    }
    
    // Limit to 20 credits, prioritizing lower levels
    let totalCredits = 0
    const coursesToAssign: typeof coursesToEnroll = []
    for (const { course, level } of coursesToEnroll) {
      if (totalCredits + course.credits <= 20) {
        coursesToAssign.push({ course, level })
        totalCredits += course.credits
      } else {
        break
      }
    }
    
    // Enroll student in selected courses
    let enrolledCount = 0
    for (let courseIndex = 0; courseIndex < coursesToAssign.length; courseIndex++) {
      const { course } = coursesToAssign[courseIndex]
      const courseSections = sectionsByCourse.get(course.id) || []
      
      if (courseSections.length === 0) continue
      
      // Distribute students across sections using modulo
      const sectionIndex = studentIndex % courseSections.length
      const section = courseSections[sectionIndex]

      // Check if already enrolled
      const existing = await prisma.assignment.findUnique({
        where: {
          studentId_sectionId: {
            studentId: student.id,
            sectionId: section.id
          }
        }
      })

      if (!existing) {
        await prisma.assignment.create({
          data: {
            studentId: student.id,
            sectionId: section.id,
            courseId: course.id,
            status: 'ENROLLED'
          }
        })

        // Create student progress
        await prisma.studentProgress.upsert({
          where: {
            studentId_courseId: {
              studentId: student.id,
              courseId: course.id
            }
          },
          create: {
            studentId: student.id,
            courseId: course.id,
            planId: swePlan.id,
            status: 'IN_PROGRESS'
          },
          update: {
            status: 'IN_PROGRESS'
          }
        })
        enrolledCount++
      }
    }
    console.log(`✅ Enrolled ${student.name} (Level ${studentLevel}) in ${enrolledCount} courses`)
  }

  // 9. Create some grades for previous semester students (for GPA calculation)
  console.log('📊 Creating grades for previous semester students...')
  const previousSemesterStudents = students.filter(s => 
    s.registrationSemesterId === sem1.id || s.registrationSemesterId === sem2.id
  )

  for (const student of previousSemesterStudents.slice(0, 5)) {
    // Get their assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        studentId: student.id,
        status: 'ENROLLED'
      },
      take: 3 // Grade first 3 courses
    })

    const grades = [95, 88, 82, 75, 70] // A+, B+, B, C+, C
    for (let i = 0; i < assignments.length && i < 3; i++) {
      const assignment = assignments[i]
      const numericGrade = grades[i]

      // Convert to letter grade
      let letterGrade = 'F'
      if (numericGrade >= 95) letterGrade = 'A+'
      else if (numericGrade >= 90) letterGrade = 'A'
      else if (numericGrade >= 85) letterGrade = 'B+'
      else if (numericGrade >= 80) letterGrade = 'B'
      else if (numericGrade >= 75) letterGrade = 'C+'
      else if (numericGrade >= 70) letterGrade = 'C'
      else if (numericGrade >= 65) letterGrade = 'D+'
      else if (numericGrade >= 60) letterGrade = 'D'
      else if (numericGrade >= 50) letterGrade = 'F'

      // Check if grade already exists
      const existingGrade = await prisma.grade.findUnique({
        where: { assignmentId: assignment.id }
      })

      if (!existingGrade) {
        await prisma.grade.create({
          data: {
            assignmentId: assignment.id,
            studentId: student.id,
            courseId: assignment.courseId,
            numericGrade,
            letterGrade,
            points: numericGrade / 100 * 4.0, // Convert to 4.0 scale
            semester: 1,
            academicYear: student.registrationSemesterId === sem1.id ? '2024/2025' : '2024/2025'
          }
        })

        // Update assignment status to COMPLETED
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { status: 'COMPLETED' }
        })

        // Update student progress
        await prisma.studentProgress.updateMany({
          where: {
            studentId: student.id,
            courseId: assignment.courseId
          },
          data: { status: 'COMPLETED' }
        })
      }
    }
    console.log(`✅ Created grades for ${student.name}`)
  }

  // 10. Create registration windows
  console.log('🪟 Creating registration windows...')
  for (const semester of createdSemesters) {
    const existing = await prisma.registrationWindow.findFirst({
      where: { semesterId: semester.id }
    })

    if (!existing) {
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      await prisma.registrationWindow.create({
        data: {
          semesterId: semester.id,
          startDate,
          endDate,
          isOpen: semester.isCurrent,
          allowAddDrop: true,
          maxRoomCapacity: 40,
          maxStudentCapacity: 30
        }
      })
      console.log(`✅ Created registration window for ${semester.name}`)
    }
  }

  console.log('\n✅ Mock data seeding completed!')
  console.log('\n📋 Summary:')
  console.log(`   - Semesters: ${createdSemesters.length}`)
  console.log(`   - Faculty: ${faculty.length}`)
  console.log(`   - Committee: ${committee.length}`)
  console.log(`   - Students: ${students.length}`)
  console.log(`   - Sections: ${sections.length}`)
  console.log(`   - Current Semester: ${currentSemester.name}`)
  console.log('\n🔑 Test Credentials:')
  console.log('   Faculty: any faculty email / Faculty123!@#')
  console.log('   Committee: any committee email / Faculty123!@#')
  console.log('   Students: student.current.1@ksu.edu.sa / Student123!@#')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding mock data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

