import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { AccessRequestStatus, Prisma, UserRole } from '@prisma/client'
import { prisma } from '@/config/database'
import { CustomError } from '@/middleware/errorHandler'
import { sendAcceptanceEmail, sendRejectionEmail, sendConfirmationEmail } from '@/utils/email'

const SALT_ROUNDS = 12
const TEMP_PASSWORD_LENGTH = 14
const APPROVABLE_ROLES = new Set<UserRole>(['STUDENT'])
const LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export interface SubmitAccessRequestInput {
  fullName: string
  email: string
  desiredRole: UserRole
  majorId?: string
  reason?: string
}

export interface SubmitMetadata {
  ip?: string
  userAgent?: string
}

export interface ListAccessRequestsParams {
  page: number
  pageSize: number
  status?: AccessRequestStatus
  search?: string
}

export interface ApprovalOptions {
  temporaryPassword?: string
  decisionNote?: string
}

export async function submitAccessRequest(
  input: SubmitAccessRequestInput,
  metadata: SubmitMetadata
) {
  if (!APPROVABLE_ROLES.has(input.desiredRole)) {
    throw new CustomError('Only Student role can be requested. Faculty access must be granted by an administrator.', 400)
  }

  const normalizedEmail = normalizeEmail(input.email)
  const reason = sanitizeOptionalText(input.reason)
  const ip = metadata.ip ? metadata.ip.substring(0, 64) : undefined
  const userAgent = metadata.userAgent ? metadata.userAgent.substring(0, 256) : undefined

  // Verify email was verified via OTP
  const verifiedOTP = await prisma.emailOTP.findFirst({
    where: {
      email: normalizedEmail,
      verified: true,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Verified within last 24 hours
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (!verifiedOTP) {
    throw new CustomError('Email must be verified before submitting a request', 400)
  }

  // Validate major if provided
  if (input.majorId) {
    const major = await prisma.major.findUnique({
      where: { id: input.majorId },
      select: { id: true }
    })
    if (!major) {
      throw new CustomError('Invalid major selected', 400)
    }
  }

  const [existingUser, pendingRequest] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
    prisma.accessRequest.findFirst({
      where: {
        email: normalizedEmail,
        status: AccessRequestStatus.PENDING
      },
      select: { id: true, createdAt: true }
    })
  ])

  if (existingUser) {
    throw new CustomError('An active account already exists for this email', 409)
  }

  if (pendingRequest) {
    throw new CustomError('A pending request already exists for this email', 409)
  }

  console.log('[AccessRequests] Creating access request in database...', {
    email: normalizedEmail,
    fullName: input.fullName.trim(),
    desiredRole: input.desiredRole,
    majorId: input.majorId || null
  })

  const created = await prisma.accessRequest.create({
    data: {
      fullName: input.fullName.trim(),
      email: normalizedEmail,
      desiredRole: input.desiredRole,
      majorId: input.majorId || null,
      reason,
      submittedIp: ip,
      submittedUserAgent: userAgent
    },
    include: {
      major: {
        select: {
          name: true
        }
      }
    }
  })

  console.info('[AccessRequests] ✅ Request created successfully in database', {
    id: created.id,
    email: created.email,
    desiredRole: created.desiredRole,
    status: created.status,
    createdAt: created.createdAt,
    databaseUrl: process.env['DATABASE_URL']?.substring(0, 50) + '...' // Log first 50 chars only
  })

  // Verify the request was actually saved by querying it back
  const verifyRequest = await prisma.accessRequest.findUnique({
    where: { id: created.id },
    select: { id: true, email: true, status: true }
  })

  if (!verifyRequest) {
    console.error('[AccessRequests] ❌ CRITICAL: Request was created but cannot be found in database!')
    throw new CustomError('Failed to persist access request', 500)
  }

  console.log('[AccessRequests] ✅ Verified request exists in database:', {
    id: verifyRequest.id,
    email: verifyRequest.email,
    status: verifyRequest.status
  })

  // Send confirmation email (non-blocking)
  sendConfirmationEmail(
    created.fullName,
    created.email,
    created.desiredRole,
    created.major?.name
  ).catch((error) => {
    console.error('[AccessRequests] Failed to send confirmation email:', error)
    // Don't fail the request if email fails
  })

  return created
}

export async function listAccessRequests(params: ListAccessRequestsParams) {
  console.log('[AccessRequests] listAccessRequests called with params:', params)
  
  const where: Prisma.AccessRequestWhereInput = {}

  if (params.status) {
    where.status = params.status
  }

  if (params.search) {
    where.OR = [
      { email: { contains: params.search, mode: 'insensitive' } },
      { fullName: { contains: params.search, mode: 'insensitive' } }
    ]
  }

  const skip = (params.page - 1) * params.pageSize

  console.log('[AccessRequests] Query where clause:', JSON.stringify(where, null, 2))
  console.log('[AccessRequests] Pagination - skip:', skip, 'take:', params.pageSize)

  const [items, total, pendingCount, approvedCount, rejectedCount] = await prisma.$transaction([
    prisma.accessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.pageSize,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        major: {
          select: {
            id: true,
            name: true
          }
        }
      }
    }),
    prisma.accessRequest.count({ where }),
    prisma.accessRequest.count({ where: { status: AccessRequestStatus.PENDING } }),
    prisma.accessRequest.count({ where: { status: AccessRequestStatus.APPROVED } }),
    prisma.accessRequest.count({ where: { status: AccessRequestStatus.REJECTED } })
  ])

  // Add lock status information
  const now = new Date()
  const itemsWithLockStatus = items.map(item => {
    const isLocked = item.lockedBy && item.lockedAt && 
      (now.getTime() - item.lockedAt.getTime()) < LOCK_TIMEOUT_MS
    return {
      ...item,
      isLocked,
      lockExpired: item.lockedBy && item.lockedAt && 
        (now.getTime() - item.lockedAt.getTime()) >= LOCK_TIMEOUT_MS
    }
  })

  return {
    data: itemsWithLockStatus,
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    }
  }
}

export async function getAccessRequestStatus(email: string, requestId: string) {
  const normalizedEmail = normalizeEmail(email)

  const request = await prisma.accessRequest.findFirst({
    where: {
      id: requestId,
      email: normalizedEmail
    },
    select: {
      id: true,
      status: true,
      desiredRole: true,
      decisionNote: true,
      decisionAt: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!request) {
    throw new CustomError('No matching request found for the provided email and reference ID', 404)
  }

  return request
}

/**
 * Generate a unique University ID (STU#### or FAC####)
 */
async function generateUniversityId(role: UserRole): Promise<string> {
  const prefix = role === 'STUDENT' ? 'STU' : 'FAC'
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    // Generate 4-digit number (0001-9999)
    const number = Math.floor(Math.random() * 9999) + 1
    const universityId = `${prefix}${number.toString().padStart(4, '0')}`

    // Check if ID already exists
    const existing = await prisma.user.findUnique({
      where: { universityId },
      select: { id: true }
    })

    if (!existing) {
      return universityId
    }

    attempts++
  }

  throw new CustomError('Failed to generate unique University ID after multiple attempts', 500)
}

/**
 * Lock a request for review (claim it)
 */
export async function lockAccessRequest(requestId: string, reviewerId: string): Promise<boolean> {
  const now = new Date()
  
  const request = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      lockedBy: true,
      lockedAt: true
    }
  })

  if (!request) {
    throw new CustomError('Request not found', 404)
  }

  if (request.status !== AccessRequestStatus.PENDING) {
    throw new CustomError('Only pending requests can be locked', 400)
  }

  // Check if already locked by someone else (and lock hasn't expired)
  if (request.lockedBy && request.lockedBy !== reviewerId && request.lockedAt) {
    const lockAge = now.getTime() - request.lockedAt.getTime()
    if (lockAge < LOCK_TIMEOUT_MS) {
      throw new CustomError('Request is currently being reviewed by another committee member', 409)
    }
  }

  // Lock the request
  await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      lockedBy: reviewerId,
      lockedAt: now
    }
  })

  return true
}

export async function approveAccessRequest(
  requestId: string,
  reviewerId: string,
  options: ApprovalOptions = {}
) {
  // Use explicit transaction timeout to handle P2028 errors
  // Retry once if transaction fails to start
  const maxRetries = 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
    const request = await tx.accessRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        email: true,
        fullName: true,
        desiredRole: true,
        majorId: true,
        lockedBy: true,
        lockedAt: true,
        major: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!request) {
      throw new CustomError('Request not found', 404)
    }

    if (request.status !== AccessRequestStatus.PENDING) {
      throw new CustomError('Only pending requests can be approved', 400)
    }

    // Check lock - must be locked by this reviewer or not locked at all
    const now = new Date()
    if (request.lockedBy && request.lockedBy !== reviewerId && request.lockedAt) {
      const lockAge = now.getTime() - request.lockedAt.getTime()
      if (lockAge < LOCK_TIMEOUT_MS) {
        throw new CustomError('Request is currently being reviewed by another committee member', 409)
      }
    }

    if (!APPROVABLE_ROLES.has(request.desiredRole)) {
      throw new CustomError('Only Student accounts can be auto-provisioned', 400)
    }

    const existingUser = await tx.user.findUnique({
      where: { email: request.email },
      select: { id: true }
    })

    if (existingUser) {
      throw new CustomError('An active account already exists for this email', 409)
    }

    // Generate University ID
    const universityId = await generateUniversityId(request.desiredRole)

    const temporaryPassword = options.temporaryPassword?.trim() || generateTemporaryPassword()
    validateTemporaryPassword(temporaryPassword)

    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS)

    // Get current semester for registration
    const currentSemester = await tx.semester.findFirst({
      where: { isCurrent: true },
      select: { id: true }
    })

    if (!currentSemester && request.desiredRole === 'STUDENT') {
      throw new CustomError('No current semester set. Please set a current semester before approving students.', 400)
    }

    const user = await tx.user.create({
      data: {
        email: request.email,
        name: request.fullName,
        password: passwordHash,
        role: request.desiredRole,
        universityId,
        majorId: request.majorId || null,
        currentLevel: 1, // Start at level 1 (deprecated but kept for compatibility)
        registrationSemesterId: currentSemester?.id || null,
        requiresPasswordChange: true // Force password change on first login
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        createdAt: true,
        majorId: true
      }
    })

    // Auto-enroll student in level 1 courses if major is assigned
    const shouldAutoEnroll = request.majorId && request.desiredRole === 'STUDENT'
    let enrollmentResult = null

    if (shouldAutoEnroll) {
      try {
        // Import auto-enrollment function (avoid circular dependency)
        const { autoEnrollStudent } = await import('../enrollment')
        // Use transaction client for auto-enrollment
        enrollmentResult = await autoEnrollStudentInTransaction(tx, user.id, user.majorId!)
        console.info('[AccessRequests] Auto-enrolled student in level 1 courses', {
          userId: user.id,
          majorId: request.majorId,
          enrolledCount: enrollmentResult?.enrolledCount || 0
        })
      } catch (error) {
        console.error('[AccessRequests] Failed to auto-enroll student:', error)
        // Don't fail the approval if auto-enrollment fails, but log it
      }
    }

    const updatedRequest = await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: AccessRequestStatus.APPROVED,
        reviewerId,
        decisionAt: new Date(),
        decisionNote: options.decisionNote?.trim() || 'Request approved, account created',
        lockedBy: null,
        lockedAt: null
      },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    console.info('[AccessRequests] Request approved', { id: requestId, reviewerId, universityId, major: request.major?.name })

    // Send acceptance email (non-blocking)
    sendAcceptanceEmail(
      request.fullName,
      request.email,
      request.desiredRole,
      universityId,
      temporaryPassword,
      request.major?.name
    ).catch(error => {
      console.error('[AccessRequests] Failed to send acceptance email:', error)
    })

    const result = {
      request: updatedRequest,
      user,
      temporaryPassword,
      universityId,
      enrollmentResult
    }

    return result
      }, {
        maxWait: 10000, // 10 seconds to start transaction
        timeout: 30000, // 30 seconds for transaction to complete
      })
    } catch (error: any) {
      lastError = error
      
      // Check if it's a transaction timeout error (P2028)
      if (error?.code === 'P2028') {
        console.warn(`[AccessRequests] Transaction timeout (attempt ${attempt}/${maxRetries}):`, {
          requestId,
          reviewerId,
          error: error.message,
          meta: error.meta,
        })
        
        // Wait a bit before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000 // 1s, 2s
          console.log(`[AccessRequests] Retrying transaction after ${waitTime}ms...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      }
      
      // If not a retryable error or max retries reached, throw
      throw error
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Transaction failed after retries')
}

export async function rejectAccessRequest(
  requestId: string,
  reviewerId: string,
  decisionNote?: string
) {
  const trimmedNote = sanitizeOptionalText(decisionNote)

  const existing = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      email: true,
      fullName: true,
      lockedBy: true,
      lockedAt: true
    }
  })

  if (!existing) {
    throw new CustomError('Request not found', 404)
  }

  if (existing.status !== AccessRequestStatus.PENDING) {
    throw new CustomError('Only pending requests can be rejected', 400)
  }

  // Check lock - must be locked by this reviewer or not locked at all
  const now = new Date()
  if (existing.lockedBy && existing.lockedBy !== reviewerId && existing.lockedAt) {
    const lockAge = now.getTime() - existing.lockedAt.getTime()
    if (lockAge < LOCK_TIMEOUT_MS) {
      throw new CustomError('Request is currently being reviewed by another committee member', 409)
    }
  }

  const updatedRequest = await prisma.accessRequest.update({
    where: { id: requestId },
    data: {
      status: AccessRequestStatus.REJECTED,
      reviewerId,
      decisionAt: new Date(),
      decisionNote: trimmedNote,
      lockedBy: null,
      lockedAt: null
    },
    include: {
      reviewer: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  console.info('[AccessRequests] Request rejected', { id: requestId, reviewerId })

  // Send rejection email (non-blocking)
  sendRejectionEmail(
    existing.fullName,
    existing.email,
    trimmedNote || undefined
  ).catch(error => {
    console.error('[AccessRequests] Failed to send rejection email:', error)
  })

  return updatedRequest
}

export function generateTemporaryPassword(length: number = TEMP_PASSWORD_LENGTH) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
  const bytes = crypto.randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length]
  }

  return password
}

function validateTemporaryPassword(password: string) {
  if (password.length < 12) {
    throw new CustomError('Temporary password must be at least 12 characters', 400)
  }

  const complexityChecks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[!@#$%&*]/.test(password)
  ]

  if (complexityChecks.includes(false)) {
    throw new CustomError('Temporary password must include upper, lower, number, and symbol characters', 400)
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function sanitizeOptionalText(value?: string | null) {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Auto-enroll student in level 1 courses within a transaction
 */
async function autoEnrollStudentInTransaction(
  tx: Prisma.TransactionClient,
  studentId: string,
  majorId: string
) {
  const student = await tx.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      currentLevel: true,
      majorId: true
    }
  })

  if (!student || !student.majorId) {
    throw new CustomError('Student not found or has no major', 404)
  }

  const level = student.currentLevel || 1

  // Get academic plan
  const plan = await tx.academicPlan.findFirst({
    where: {
      majorId: student.majorId,
      isActive: true
    },
    include: {
      courses: {
        where: {
          semester: level
        },
        include: {
          course: {
            include: {
              sections: {
                include: {
                  instructor: true
                },
                take: 1 // Get first available section
              }
            }
          }
        }
      }
    }
  })

  if (!plan) {
    throw new CustomError('Academic plan not found', 404)
  }

  const enrolledCourses: string[] = []
  const skippedCourses: string[] = []

  for (const courseInPlan of plan.courses) {
    const course = courseInPlan.course

    // For level 1 courses, prerequisites are typically not required
    // But we'll check if there are any prerequisites and if student has completed them
    if (level === 1) {
      // Level 1 courses usually have no prerequisites, but check anyway
      const prerequisites = await tx.prerequisite.findMany({
        where: { courseId: course.id }
      })
      
      if (prerequisites.length > 0) {
        // Check if student has completed all prerequisites
        const completedCourses = await tx.studentProgress.findMany({
          where: {
            studentId,
            status: 'COMPLETED',
            courseId: {
              in: prerequisites.map(p => p.prerequisiteCourseId)
            }
          }
        })
        
        if (completedCourses.length < prerequisites.length) {
          skippedCourses.push(course.code)
          continue
        }
      }
    } else {
      // For higher levels, use the full prerequisite check
      // Note: This uses prisma directly, not tx, which is acceptable for read operations
      const enrollmentCheck = await canEnrollInCourse(studentId, course.id)
      if (!enrollmentCheck.canEnroll) {
        skippedCourses.push(course.code)
        continue
      }
    }

    // Check if already enrolled
    const existingProgress = await tx.studentProgress.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: course.id
        }
      }
    })

    if (existingProgress && existingProgress.status !== 'NOT_TAKEN') {
      continue
    }

    // Get first available section
    if (course.sections.length === 0) {
      skippedCourses.push(course.code)
      continue
    }

    const section = course.sections[0]

    // Check section capacity
    const currentEnrollments = await tx.assignment.count({
      where: {
        sectionId: section.id,
        status: 'ENROLLED'
      }
    })

    if (currentEnrollments >= 30) {
      skippedCourses.push(course.code)
      continue
    }

    // Enroll student
    await tx.assignment.upsert({
      where: {
        studentId_sectionId: {
          studentId,
          sectionId: section.id
        }
      },
      create: {
        studentId,
        sectionId: section.id,
        courseId: course.id,
        status: 'ENROLLED'
      },
      update: {
        status: 'ENROLLED'
      }
    })

    // Update student progress
    await tx.studentProgress.upsert({
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

    enrolledCourses.push(course.code)
  }

  return {
    enrolledCount: enrolledCourses.length,
    enrolledCourses,
    skippedCount: skippedCourses.length,
    skippedCourses
  }
}

