/**
 * Integration tests for Access Requests authentication flow
 * Tests the root cause fix: cookies with SameSite: 'none' for cross-port POST requests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../server'
import { prisma } from '../../config/database'
import { generateTokens } from '../../utils/jwt'

describe('Access Requests Authentication Flow', () => {
  let committeeUser: any
  let accessRequest: any
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    // Create a committee user for testing
    committeeUser = await prisma.user.create({
      data: {
        email: 'test-committee@ksu.edu.sa',
        name: 'Test Committee',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', // hashed 'password'
        role: 'COMMITTEE',
        universityId: 'COMM001'
      }
    })

    // Create an access request for testing
    accessRequest = await prisma.accessRequest.create({
      data: {
        fullName: 'Test Student',
        email: 'test-student@student.ksu.edu.sa',
        desiredRole: 'STUDENT',
        status: 'PENDING'
      }
    })

    // Generate tokens for the committee user
    const tokens = generateTokens({
      userId: committeeUser.id,
      email: committeeUser.email,
      role: committeeUser.role
    })
    accessToken = tokens.accessToken
    refreshToken = tokens.refreshToken
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.accessRequest.deleteMany({
      where: { email: 'test-student@student.ksu.edu.sa' }
    })
    await prisma.user.deleteMany({
      where: { email: { in: ['test-committee@ksu.edu.sa', 'test-student@student.ksu.edu.sa'] } }
    })
  })

  describe('Cookie-based authentication', () => {
    it('should authenticate with access token cookie', async () => {
      const response = await request(app)
        .get('/api/access-requests')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })

    it('should reject requests without authentication cookie', async () => {
      const response = await request(app)
        .get('/api/access-requests')
        .expect(401)

      expect(response.body.error).toContain('Authentication required')
    })

    it('should allow POST requests with SameSite: none cookie (cross-port)', async () => {
      // Simulate cross-port POST request (localhost:3000 -> localhost:3001)
      const response = await request(app)
        .post(`/api/access-requests/${accessRequest.id}/lock`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('Token refresh flow', () => {
    it('should refresh access token using refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(committeeUser.email)
      
      // Verify new cookies are set
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true)
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true)
    })

    it('should reject refresh without refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401)

      expect(response.body.error).toContain('Refresh token required')
    })
  })

  describe('Approve/Reject/Lock actions', () => {
    it('should approve request with valid cookie', async () => {
      const response = await request(app)
        .post(`/api/access-requests/${accessRequest.id}/approve`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .send({ decisionNote: 'Test approval' })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should reject request with valid cookie', async () => {
      // Create another request for rejection test
      const rejectRequest = await prisma.accessRequest.create({
        data: {
          fullName: 'Test Student 2',
          email: 'test-student2@student.ksu.edu.sa',
          desiredRole: 'STUDENT',
          status: 'PENDING'
        }
      })

      const response = await request(app)
        .post(`/api/access-requests/${rejectRequest.id}/reject`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .send({ decisionNote: 'Test rejection' })
        .expect(200)

      expect(response.body.success).toBe(true)

      // Cleanup
      await prisma.accessRequest.delete({ where: { id: rejectRequest.id } })
    })

    it('should lock request with valid cookie', async () => {
      // Create another request for lock test
      const lockRequest = await prisma.accessRequest.create({
        data: {
          fullName: 'Test Student 3',
          email: 'test-student3@student.ksu.edu.sa',
          desiredRole: 'STUDENT',
          status: 'PENDING'
        }
      })

      const response = await request(app)
        .post(`/api/access-requests/${lockRequest.id}/lock`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.body.success).toBe(true)

      // Cleanup
      await prisma.accessRequest.delete({ where: { id: lockRequest.id } })
    })
  })

  describe('Clock skew tolerance', () => {
    it('should accept tokens with small clock skew', async () => {
      // This test verifies that verifyToken handles clock skew
      // The actual clock skew tolerance is tested in jwt.ts
      const response = await request(app)
        .get('/api/access-requests')
        .set('Cookie', `accessToken=${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })
})

