import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  approveAccessRequest,
  generateTemporaryPassword,
  getAccessRequestStatus,
  rejectAccessRequest,
  submitAccessRequest
} from './service'
vi.mock('@prisma/client', () => ({
  AccessRequestStatus: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
  },
  UserRole: {
    STUDENT: 'STUDENT',
    FACULTY: 'FACULTY',
    COMMITTEE: 'COMMITTEE'
  },
  Prisma: {}
}))

const { mockBcryptHash } = vi.hoisted(() => ({
  mockBcryptHash: vi.fn().mockResolvedValue('hashed-password')
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockBcryptHash
  }
}))

const { mockAccessRequest, mockUser, mockTransaction } = vi.hoisted(() => {
  const accessRequest = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }

  const user = {
    findUnique: vi.fn(),
    create: vi.fn()
  }

  const transaction = vi.fn(async (operations: any) => {
    if (typeof operations === 'function') {
      return operations({
        accessRequest,
        user
      })
    }
    if (Array.isArray(operations)) {
      return Promise.all(operations)
    }
    return null
  })

  return {
    mockAccessRequest: accessRequest,
    mockUser: user,
    mockTransaction: transaction
  }
})

vi.mock('@/config/database', () => ({
  prisma: {
    accessRequest: mockAccessRequest,
    user: mockUser,
    $transaction: mockTransaction
  }
}))

const resetMocks = () => {
  Object.values(mockAccessRequest).forEach((fn) => fn.mockReset())
  Object.values(mockUser).forEach((fn) => fn.mockReset())
  mockTransaction.mockClear()
  mockBcryptHash.mockClear()
}

describe('access request service', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('submits a new access request when no duplicates exist', async () => {
    mockUser.findUnique.mockResolvedValue(null)
    mockAccessRequest.findFirst.mockResolvedValue(null)
    mockAccessRequest.create.mockResolvedValue({
      id: 'req_1',
      email: 'user@example.com',
      status: 'PENDING',
      desiredRole: 'STUDENT',
      createdAt: new Date()
    })

    const request = await submitAccessRequest(
      {
        fullName: 'Jane Example',
        email: 'user@example.com',
        desiredRole: 'STUDENT',
        reason: 'Need access'
      },
      { ip: '127.0.0.1', userAgent: 'jest' }
    )

    expect(request.id).toEqual('req_1')
    expect(mockAccessRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'user@example.com',
          desiredRole: 'STUDENT'
        })
      })
    )
  })

  it('creates user and returns temp password on approval', async () => {
    mockAccessRequest.findUnique.mockResolvedValue({
      id: 'req_2',
      status: 'PENDING',
      email: 'faculty@example.com',
      fullName: 'Faculty User',
      desiredRole: 'FACULTY'
    })
    mockUser.findUnique.mockResolvedValue(null)
    mockUser.create.mockResolvedValue({
      id: 'user_1',
      email: 'faculty@example.com',
      name: 'Faculty User',
      role: 'FACULTY',
      createdAt: new Date()
    })
    mockAccessRequest.update.mockResolvedValue({
      id: 'req_2',
      status: 'APPROVED',
      reviewerId: 'reviewer_1',
      decisionNote: 'Approved',
      reviewer: { id: 'reviewer_1', name: 'Admin', email: 'admin@example.com' }
    })

    const result = await approveAccessRequest('req_2', 'reviewer_1', {
      temporaryPassword: 'ValidPass123!'
    })

    expect(result.user.email).toEqual('faculty@example.com')
    expect(result.request.status).toEqual('APPROVED')
    expect(result.temporaryPassword).toEqual('ValidPass123!')
    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'faculty@example.com'
        })
      })
    )
  })

  it('rejects pending requests with a note', async () => {
    mockAccessRequest.findUnique.mockResolvedValue({
      id: 'req_3',
      status: 'PENDING'
    })
    mockAccessRequest.update.mockResolvedValue({
      id: 'req_3',
      status: 'REJECTED',
      decisionNote: 'Missing details',
      reviewer: { id: 'reviewer_2', name: 'Sam', email: 'sam@example.com' }
    })

    const result = await rejectAccessRequest('req_3', 'reviewer_2', 'Missing details')

    expect(result.status).toEqual('REJECTED')
    expect(result.decisionNote).toEqual('Missing details')
  })

  it('returns request status when email and reference match', async () => {
    mockAccessRequest.findFirst.mockResolvedValue({
      id: 'req_4',
      status: 'PENDING',
      desiredRole: 'STUDENT',
      decisionNote: null,
      decisionAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const status = await getAccessRequestStatus('student@example.com', 'req_4')
    expect(status.id).toEqual('req_4')
    expect(mockAccessRequest.findFirst).toHaveBeenCalled()
  })

  it('generates a secure temporary password', () => {
    const password = generateTemporaryPassword(16)
    expect(password).toHaveLength(16)
    expect(/[A-Z]/.test(password)).toBe(true)
    expect(/[a-z]/.test(password)).toBe(true)
    expect(/\d/.test(password)).toBe(true)
    expect(/[!@#$%&*]/.test(password)).toBe(true)
  })
})

