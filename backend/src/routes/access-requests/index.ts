import { Router } from 'express'
import { authenticateToken, AuthRequest, requireAdmin } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'
import {
  accessRequestApprovalSchema,
  accessRequestListQuerySchema,
  accessRequestRejectionSchema,
  accessRequestStatusSchema,
  accessRequestSubmissionSchema
} from '@/utils/validation'
import {
  approveAccessRequest,
  generateTemporaryPassword,
  getAccessRequestStatus,
  listAccessRequests,
  submitAccessRequest,
  rejectAccessRequest,
  lockAccessRequest
} from './service'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    console.log('[AccessRequests] POST / - Received request submission', {
      body: { ...req.body, email: req.body.email?.substring(0, 10) + '...' }, // Log partial email for privacy
      databaseUrl: process.env['DATABASE_URL']?.substring(0, 50) + '...' // Log first 50 chars only
    })

    const payload = accessRequestSubmissionSchema.parse(req.body)
    const request = await submitAccessRequest(payload, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    })

    console.log('[AccessRequests] POST / - Request created successfully, sending response', {
      requestId: request.id,
      email: request.email.substring(0, 10) + '...'
    })

    res.status(201).json({
      success: true,
      message: 'Request received. An administrator will review it shortly.',
      data: {
        id: request.id,
        status: request.status,
        desiredRole: request.desiredRole,
        submittedAt: request.createdAt
      }
    })

    // Verify request still exists after response (to catch any async deletion)
    setTimeout(async () => {
      try {
        const { prisma } = await import('@/config/database')
        const verify = await prisma.accessRequest.findUnique({
          where: { id: request.id },
          select: { id: true, status: true }
        })
        if (verify) {
          console.log('[AccessRequests] ✅ Request still exists in database after response:', {
            id: verify.id,
            status: verify.status
          })
        } else {
          console.error('[AccessRequests] ❌ Request was deleted after creation!', {
            requestId: request.id
          })
        }
      } catch (err) {
        console.error('[AccessRequests] Error verifying request persistence:', err)
      }
    }, 2000) // Check after 2 seconds
  } catch (error) {
    console.error('[AccessRequests] POST / - Error:', error)
    next(error)
  }
})

router.get('/status', async (req, res, next) => {
  try {
    const params = accessRequestStatusSchema.parse(req.query)
    const request = await getAccessRequestStatus(params.email, params.requestId)

    res.json({
      success: true,
      data: request,
      message: request.status === 'APPROVED'
        ? 'Your account is ready. Use the credentials shared by the committee to sign in.'
        : request.status === 'REJECTED'
          ? 'The request was rejected. Review the note and resubmit if needed.'
          : 'Your request is still pending review.'
    })
  } catch (error) {
    next(error)
  }
})

router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    console.log('[AccessRequests] GET / - Received request from user:', {
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.role
    })
    console.log('[AccessRequests] GET / - Query params:', req.query)
    
    const params = accessRequestListQuerySchema.parse(req.query)
    console.log('[AccessRequests] GET / - Parsed params:', params)
    
    const result = await listAccessRequests(params)
    console.log('[AccessRequests] GET / - Result:', {
      total: result.meta.total,
      itemsCount: result.data.length,
      pending: result.meta.counts.pending,
      approved: result.meta.counts.approved,
      rejected: result.meta.counts.rejected
    })

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('[AccessRequests] GET / - Error:', error)
    next(error)
  }
})

router.post('/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    console.log('[AccessRequests] POST /:id/approve - Received approval request', {
      requestId: req.params.id,
      userId: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      method: req.method,
      originalUrl: req.originalUrl || req.url,
      hasCookies: !!req.cookies,
      cookieKeys: Object.keys(req.cookies || {}),
      hasAuthHeader: !!req.headers.authorization,
    })

    // Use req.userId as fallback if req.user.id is missing (defensive check)
    const reviewerId = req.user?.id || req.userId
    if (!reviewerId) {
      console.error('[AccessRequests] ❌ Reviewer identity missing in approve request', {
        requestId: req.params.id,
        hasUser: !!req.user,
        userId: req.user?.id,
        reqUserId: req.userId,
        userObject: req.user,
      })
      // This is a server error (500), not an auth error (401)
      // Auth succeeded, but user ID is missing - indicates middleware bug
      throw new CustomError('Reviewer identity missing', 500)
    }

    const body = accessRequestApprovalSchema.parse(req.body ?? {})
    const decisionNote = body.decisionNote

    console.log('[AccessRequests] Approving request with options:', {
      requestId: req.params.id,
      reviewerId: reviewerId,
      hasDecisionNote: !!decisionNote
    })

    let result
    try {
      result = await approveAccessRequest(req.params.id, reviewerId, {
        temporaryPassword: body.temporaryPassword || generateTemporaryPassword(),
        decisionNote
      })
    } catch (error: any) {
      // Handle Prisma transaction timeout errors specifically
      if (error?.code === 'P2028') {
        console.error('[AccessRequests] ❌ Transaction timeout error:', {
          requestId: req.params.id,
          error: error.message,
          meta: error.meta,
        })
        throw new CustomError(
          'The database is currently busy. Please try again in a few moments.',
          503 // Service Unavailable
        )
      }
      // Re-throw other errors
      throw error
    }

    console.log('[AccessRequests] ✅ Request approved successfully', {
      requestId: req.params.id,
      newUserId: result.user.id,
      email: result.user.email
    })

    res.json({
      success: true,
      message: 'Request approved and account created',
      data: result.request,
      account: result.user,
      temporaryPassword: result.temporaryPassword
    })
  } catch (error) {
    console.error('[AccessRequests] ❌ Error approving request:', error)
    next(error)
  }
})

router.post('/:id/reject', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    // Use req.userId as fallback if req.user.id is missing (defensive check)
    const reviewerId = req.user?.id || req.userId
    if (!reviewerId) {
      console.error('[AccessRequests] ❌ Reviewer identity missing in reject request', {
        requestId: req.params.id,
        hasUser: !!req.user,
        userId: req.user?.id,
        reqUserId: req.userId,
      })
      throw new CustomError('Reviewer identity missing', 500)
    }

    const body = accessRequestRejectionSchema.parse(req.body ?? {})
    const updated = await rejectAccessRequest(req.params.id, reviewerId, body.decisionNote)

    res.json({
      success: true,
      message: 'Request rejected',
      data: updated
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/lock', authenticateToken, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    // Use req.userId as fallback if req.user.id is missing (defensive check)
    const reviewerId = req.user?.id || req.userId
    if (!reviewerId) {
      console.error('[AccessRequests] ❌ Reviewer identity missing in lock request', {
        requestId: req.params.id,
        hasUser: !!req.user,
        userId: req.user?.id,
        reqUserId: req.userId,
      })
      throw new CustomError('Reviewer identity missing', 500)
    }

    await lockAccessRequest(req.params.id, reviewerId)

    res.json({
      success: true,
      message: 'Request locked for review'
    })
  } catch (error) {
    next(error)
  }
})

export { router as accessRequestRoutes }

