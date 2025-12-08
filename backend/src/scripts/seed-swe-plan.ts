/**
 * Seed script for Software Engineering (SWE) Academic Plan
 * Based on KSU SWE Program Study Plan
 * 
 * This script creates:
 * - SWE Major
 * - Academic Plan with all 8 semesters
 * - All required courses with prerequisites and co-requisites
 * - Elective groups (University, Math/Stats, General Science, Department)
 */

import { prisma } from '../config/database'

interface CourseData {
  code: string
  name: string
  credits: number
  level: number // 1-8
  semester: number // 1-8
  courseType: 'REQUIRED' | 'UNIVERSITY_ELECTIVE' | 'MATH_ELECTIVE' | 'SCIENCE_ELECTIVE' | 'DEPT_ELECTIVE'
  prerequisites?: string[] // Course codes
  corequisites?: string[] // Course codes
  electiveGroup?: string
}

const SWE_COURSES: CourseData[] = [
  // Semester 1 (Level 1)
  { code: 'ARAB 100', name: 'Writing Skills', credits: 3, level: 1, semester: 1, courseType: 'REQUIRED' },
  { code: 'ENT 101', name: 'Entrepreneurship', credits: 2, level: 1, semester: 1, courseType: 'REQUIRED' },
  { code: 'CT 101', name: 'Computer Skills and Artificial Intelligence', credits: 2, level: 1, semester: 1, courseType: 'REQUIRED' },
  { code: 'MATH 101', name: 'Differential Calculus', credits: 3, level: 1, semester: 1, courseType: 'REQUIRED' },
  { code: 'ENGS 100', name: 'English Language', credits: 6, level: 1, semester: 1, courseType: 'REQUIRED' },

  // Semester 2 (Level 2)
  { code: 'CI 101', name: 'University Skills', credits: 2, level: 2, semester: 2, courseType: 'REQUIRED' },
  { code: 'ENGS 110', name: 'English', credits: 3, level: 2, semester: 2, courseType: 'REQUIRED', prerequisites: ['ENGS 100'] },
  { code: 'STAT 101', name: 'Introduction to Probability and Statistics', credits: 3, level: 2, semester: 2, courseType: 'REQUIRED' },
  { code: 'CHEM 101', name: 'General Chemistry (1)', credits: 4, level: 2, semester: 2, courseType: 'REQUIRED' },
  { code: 'EPH 101', name: 'Fitness and Health Education', credits: 1, level: 2, semester: 2, courseType: 'REQUIRED' },

  // Semester 3 (Level 3)
  { code: 'CSC 111', name: 'Computer Programming (1)', credits: 4, level: 3, semester: 3, courseType: 'REQUIRED' },
  { code: 'MATH 106', name: 'Integral Calculus', credits: 3, level: 3, semester: 3, courseType: 'REQUIRED', prerequisites: ['MATH 101'] },
  { code: 'PHYS 103', name: 'General Physics (1)', credits: 4, level: 3, semester: 3, courseType: 'REQUIRED' },
  { code: 'MATH 151', name: 'Discrete Mathematics', credits: 3, level: 3, semester: 3, courseType: 'REQUIRED' },
  { code: 'CSC 113', name: 'Computer Programming (2)', credits: 4, level: 3, semester: 3, courseType: 'REQUIRED', prerequisites: ['CSC 111'] },

  // Semester 4 (Level 4)
  { code: 'PHYS 104', name: 'General Physics (2)', credits: 4, level: 4, semester: 4, courseType: 'REQUIRED', prerequisites: ['PHYS 103'] },
  { code: 'SWE 211', name: 'Introduction to Software Engineering', credits: 3, level: 4, semester: 4, courseType: 'REQUIRED', prerequisites: ['CSC 113'] },
  { code: 'CENX 303', name: 'Computer Communications & Networks', credits: 3, level: 4, semester: 4, courseType: 'REQUIRED' },
  { code: 'CSC 220', name: 'Computer Organization', credits: 3, level: 4, semester: 4, courseType: 'REQUIRED' },
  { code: 'MATH 244', name: 'Linear Algebra', credits: 3, level: 4, semester: 4, courseType: 'REQUIRED' },

  // Semester 5 (Level 5)
  { code: 'SWE 312', name: 'Software Requirements Engineering', credits: 3, level: 5, semester: 5, courseType: 'REQUIRED', prerequisites: ['SWE 211'] },
  { code: 'SWE 314', name: 'Software Security Engineering', credits: 3, level: 5, semester: 5, courseType: 'REQUIRED', prerequisites: ['SWE 211'] },
  { code: 'CSC 212', name: 'Data Structures', credits: 4, level: 5, semester: 5, courseType: 'REQUIRED', prerequisites: ['CSC 113'] },
  { code: 'IS 230', name: 'Introduction to Database Systems', credits: 3, level: 5, semester: 5, courseType: 'REQUIRED' },
  { code: 'SWE 381', name: 'Web Application Development', credits: 3, level: 5, semester: 5, courseType: 'REQUIRED', prerequisites: ['SWE 211'] },

  // Semester 6 (Level 6)
  { code: 'SWE 333', name: 'Software Quality Assurance', credits: 3, level: 6, semester: 6, courseType: 'REQUIRED', prerequisites: ['SWE 312'] },
  { code: 'CSC 227', name: 'Operating Systems', credits: 3, level: 6, semester: 6, courseType: 'REQUIRED' },
  { code: 'SWE 321', name: 'Software Design & Architecture', credits: 3, level: 6, semester: 6, courseType: 'REQUIRED', prerequisites: ['SWE 312'] },
  { code: 'SWE 434', name: 'Software Testing and Validation', credits: 3, level: 6, semester: 6, courseType: 'REQUIRED', prerequisites: ['SWE 333'] },
  { code: 'SWE 482', name: 'Human-Computer Interaction', credits: 3, level: 6, semester: 6, courseType: 'REQUIRED' },

  // Semester 7 (Level 7)
  { code: 'IC 107', name: 'Professional Ethics', credits: 2, level: 7, semester: 7, courseType: 'REQUIRED' },
  { code: 'SWE 479', name: 'Practical Training', credits: 3, level: 7, semester: 7, courseType: 'REQUIRED' },
  { code: 'SWE 477', name: 'Software Engineering Code of Ethics & Professional Practice', credits: 2, level: 7, semester: 7, courseType: 'REQUIRED' },
  { code: 'SWE 496', name: 'Graduation Project I', credits: 3, level: 7, semester: 7, courseType: 'REQUIRED', prerequisites: ['SWE 321', 'SWE 333'] },
  { code: 'SWE 444', name: 'Software Construction Laboratory', credits: 3, level: 7, semester: 7, courseType: 'REQUIRED', prerequisites: ['SWE 321', 'SWE 333'] },

  // Semester 8 (Level 8)
  { code: 'IC 108', name: 'Current Issues', credits: 2, level: 8, semester: 8, courseType: 'REQUIRED' },
  { code: 'SWE 466', name: 'Software Project Management', credits: 3, level: 8, semester: 8, courseType: 'REQUIRED', prerequisites: ['SWE 333'] },
  { code: 'SWE 497', name: 'Graduation Project II', credits: 3, level: 8, semester: 8, courseType: 'REQUIRED', prerequisites: ['SWE 496'] },
  { code: 'SWE 455', name: 'Software Maintenance and Evolution', credits: 3, level: 8, semester: 8, courseType: 'REQUIRED' },

  // University Electives (4 hours required)
  { code: 'IC 101', name: 'Principles of Islamic Culture', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'IC 100', name: 'Studies in the Prophet Biography', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'IC 103', name: 'Economic System in Islam', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'IC 105', name: 'Human Rights', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'IC 106', name: 'Medical Jurisprudence', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'QURN 100', name: 'Quran Kareem', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'IC 109', name: 'Development Role of Women', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'IC 102', name: 'Family in Islam', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },
  { code: 'IC 104', name: 'Islamic Political System', credits: 2, level: 2, semester: 2, courseType: 'UNIVERSITY_ELECTIVE', electiveGroup: 'UNIVERSITY' },

  // Math & Statistics Electives (6 hours required)
  { code: 'MATH 254', name: 'Numerical Methods', credits: 3, level: 4, semester: 4, courseType: 'MATH_ELECTIVE', electiveGroup: 'MATH_STATS' },
  { code: 'MATH 203', name: 'Differential & Integral Calculus', credits: 3, level: 4, semester: 4, courseType: 'MATH_ELECTIVE', electiveGroup: 'MATH_STATS' },
  { code: 'OPER 122', name: 'Introduction to Operations Research', credits: 3, level: 4, semester: 4, courseType: 'MATH_ELECTIVE', electiveGroup: 'MATH_STATS' },

  // General Science Electives (3 hours required)
  { code: 'GPH 201', name: 'Principles of Geophysics', credits: 3, level: 3, semester: 3, courseType: 'SCIENCE_ELECTIVE', electiveGroup: 'GENERAL_SCIENCE' },
  { code: 'ZOOL 145', name: 'Biology', credits: 3, level: 3, semester: 3, courseType: 'SCIENCE_ELECTIVE', electiveGroup: 'GENERAL_SCIENCE' },
  { code: 'BCH 101', name: 'General Biochemistry', credits: 3, level: 3, semester: 3, courseType: 'SCIENCE_ELECTIVE', electiveGroup: 'GENERAL_SCIENCE' },
  { code: 'PHYS 201', name: 'Mathematical Physics (1)', credits: 3, level: 3, semester: 3, courseType: 'SCIENCE_ELECTIVE', electiveGroup: 'GENERAL_SCIENCE' },
  { code: 'MBI 140', name: 'General Microbiology', credits: 3, level: 3, semester: 3, courseType: 'SCIENCE_ELECTIVE', electiveGroup: 'GENERAL_SCIENCE' },

  // SWE Department Electives (9 hours required - select 3 courses)
  { code: 'SWE 484', name: 'Multimedia Computing', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CSC 215', name: 'Procedural Programming With C', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CENX 445', name: 'Network Protocols & Algorithms', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'SWE 486', name: 'Cloud Computing & Big Data', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'SWE 488', name: 'Complex Systems Engineering', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CENX 318', name: 'Embedded Systems Design', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CSC 311', name: 'Design & Analysis of Algorithms', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'IS 485', name: 'Enterprise Resource Planning Systems Lab', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CENX 316', name: 'Computer Architecture & Assembly Languages', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'SWE 485', name: 'Selected Topics in Software Engineering', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CSC 478', name: 'Digital Image Processing and Analysis', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CSC 476', name: 'Computer Graphics', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'IS 385', name: 'Enterprise Resource Planning Systems', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'CSC 361', name: 'Artificial Intelligence', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'SWE 481', name: 'Advanced Web Applications Engineering', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' },
  { code: 'SWE 483', name: 'Mobile Application Development', credits: 3, level: 7, semester: 7, courseType: 'DEPT_ELECTIVE', electiveGroup: 'DEPT_SWE' }
]

async function seedSWEPlan() {
  console.log('🌱 Starting SWE Academic Plan seed...')

  try {
    // 1. Create or get SWE Major
    // Try by code first, fallback to name if code field doesn't exist yet
    let sweMajor = await prisma.major.findFirst({
      where: {
        OR: [
          { code: 'SWE' },
          { name: 'Software Engineering' }
        ]
      }
    })

    if (!sweMajor) {
      sweMajor = await prisma.major.create({
        data: {
          code: 'SWE',
          name: 'Software Engineering',
          description: 'Bachelor of Science in Software Engineering - KSU Program'
        }
      })
      console.log('✅ Created SWE Major')
    } else {
      console.log('✅ SWE Major already exists')
      // Update code if it doesn't exist
      if (!sweMajor.code) {
        try {
          sweMajor = await prisma.major.update({
            where: { id: sweMajor.id },
            data: { code: 'SWE' }
          })
          console.log('✅ Updated SWE Major with code')
        } catch (error) {
          console.log('⚠️  Could not update code field (may not exist in schema yet)')
        }
      }
    }

    // 2. Create Elective Groups
    const electiveGroups = [
      { code: 'UNIVERSITY', name: 'University Electives', minCredits: 4, maxCredits: 4 },
      { code: 'MATH_STATS', name: 'Math & Statistics Electives', minCredits: 6, maxCredits: 6 },
      { code: 'GENERAL_SCIENCE', name: 'General Science Electives', minCredits: 3, maxCredits: 3 },
      { code: 'DEPT_SWE', name: 'SWE Department Electives', minCredits: 9, maxCredits: 9 }
    ]

    const groupMap = new Map<string, string>()

    for (const group of electiveGroups) {
      // Try by code first, fallback to name
      let existing = await prisma.electiveGroup.findFirst({
        where: {
          OR: [
            { code: group.code },
            { name: group.name }
          ]
        }
      })

      if (!existing) {
        existing = await prisma.electiveGroup.create({
          data: group
        })
        console.log(`✅ Created elective group: ${group.name}`)
      }
      groupMap.set(group.code, existing.id)
    }

    // 3. Create Levels (1-8)
    const levels = []
    for (let i = 1; i <= 8; i++) {
      let level = await prisma.level.findUnique({
        where: { name: `Level ${i}` }
      })

      if (!level) {
        level = await prisma.level.create({
          data: { name: `Level ${i}` }
        })
        console.log(`✅ Created Level ${i}`)
      }
      levels[i] = level
    }

    // 4. Create Academic Plan
    let plan = await prisma.academicPlan.findFirst({
      where: {
        majorId: sweMajor.id,
        isActive: true
      }
    })

    if (plan) {
      // Deactivate old plan
      await prisma.academicPlan.update({
        where: { id: plan.id },
        data: { isActive: false }
      })
      console.log('⚠️  Deactivated existing plan')
    }

    plan = await prisma.academicPlan.create({
      data: {
        majorId: sweMajor.id,
        name: 'Software Engineering Study Plan',
        description: 'KSU SWE Program - 8 Semesters',
        totalCredits: 124 // Approximate total
      }
    })
    console.log('✅ Created Academic Plan')

    // 5. Create Courses and add to plan
    const courseMap = new Map<string, string>()

    for (const courseData of SWE_COURSES) {
      // Get or create level
      const level = levels[courseData.level]

      // Create course
      let course = await prisma.course.findUnique({
        where: { code: courseData.code }
      })

      if (!course) {
        course = await prisma.course.create({
          data: {
            code: courseData.code,
            name: courseData.name,
            credits: courseData.credits,
            levelId: level.id,
            courseType: courseData.courseType,
            electiveGroupId: courseData.electiveGroup ? groupMap.get(courseData.electiveGroup) : null
          }
        })
        console.log(`✅ Created course: ${courseData.code}`)
      } else {
        // Update course if needed
        course = await prisma.course.update({
          where: { id: course.id },
          data: {
            name: courseData.name,
            credits: courseData.credits,
            levelId: level.id,
            courseType: courseData.courseType,
            electiveGroupId: courseData.electiveGroup ? groupMap.get(courseData.electiveGroup) : null
          }
        })
      }

      courseMap.set(courseData.code, course.id)

      // Add to plan
      const existingInPlan = await prisma.courseInPlan.findUnique({
        where: {
          planId_courseId: {
            planId: plan.id,
            courseId: course.id
          }
        }
      })

      if (!existingInPlan) {
        // Get display order
        const maxOrder = await prisma.courseInPlan.findFirst({
          where: {
            planId: plan.id,
            semester: courseData.semester
          },
          orderBy: { displayOrder: 'desc' },
          select: { displayOrder: true }
        })

        await prisma.courseInPlan.create({
          data: {
            planId: plan.id,
            courseId: course.id,
            semester: courseData.semester,
            isRequired: courseData.courseType === 'REQUIRED',
            displayOrder: (maxOrder?.displayOrder ?? -1) + 1
          }
        })
      }
    }

    // 6. Create Prerequisites
    for (const courseData of SWE_COURSES) {
      if (courseData.prerequisites && courseData.prerequisites.length > 0) {
        const courseId = courseMap.get(courseData.code)
        if (!courseId) continue

        for (const prereqCode of courseData.prerequisites) {
          const prereqId = courseMap.get(prereqCode)
          if (!prereqId) {
            console.warn(`⚠️  Prerequisite ${prereqCode} not found for ${courseData.code}`)
            continue
          }

          const existing = await prisma.prerequisite.findUnique({
            where: {
              courseId_prerequisiteCourseId: {
                courseId,
                prerequisiteCourseId: prereqId
              }
            }
          })

          if (!existing) {
            await prisma.prerequisite.create({
              data: {
                courseId,
                prerequisiteCourseId: prereqId
              }
            })
            console.log(`✅ Added prerequisite: ${prereqCode} → ${courseData.code}`)
          }
        }
      }
    }

    // 7. Create Co-requisites (if any)
    for (const courseData of SWE_COURSES) {
      if (courseData.corequisites && courseData.corequisites.length > 0) {
        const courseId = courseMap.get(courseData.code)
        if (!courseId) continue

        for (const coreqCode of courseData.corequisites) {
          const coreqId = courseMap.get(coreqCode)
          if (!coreqId) {
            console.warn(`⚠️  Co-requisite ${coreqCode} not found for ${courseData.code}`)
            continue
          }

          const existing = await prisma.corequisite.findUnique({
            where: {
              courseId_corequisiteCourseId: {
                courseId,
                corequisiteCourseId: coreqId
              }
            }
          })

          if (!existing) {
            await prisma.corequisite.create({
              data: {
                courseId,
                corequisiteCourseId: coreqId
              }
            })
            console.log(`✅ Added co-requisite: ${coreqCode} ↔ ${courseData.code}`)
          }
        }
      }
    }

    console.log('✅ SWE Academic Plan seed completed successfully!')
    console.log(`📊 Created ${courseMap.size} courses across 8 semesters`)
    console.log(`📚 Total credits: ~124 hours`)

  } catch (error) {
    console.error('❌ Error seeding SWE plan:', error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedSWEPlan()
    .then(() => {
      console.log('✅ Seed completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error)
      process.exit(1)
    })
}

export { seedSWEPlan }

