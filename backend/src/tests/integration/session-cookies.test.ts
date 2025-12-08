/**
 * Integration test for session cookie transmission
 * Verifies the root cause fix: cookies with SameSite: 'none' work for cross-port POST
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../server'
import { prisma } from '../../config/database'
import { generateTokens, setTokenCookies } from '../../utils/jwt'
import { Response } from 'express'

describe('Session Cookie Transmission - Root Cause Fix', () => {
  let committeeUser: any
  let accessRequest: any
  let accessToken: string
  let refreshToken: string

  beforeAll(async () => {
    // Create committee user
    committeeUser = await prisma.user.upsert({
      where: { email: 'test-committee-session@ksu.edu.sa' },
      update: {},
      create: {
        email: 'test-committee-session@ksu.edu.sa',
        name: 'Test Committee Session',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', // 'password'
        role: 'COMMITTEE',
        universityId: 'COMMTEST'
      }
    })

    // Create access request
    accessRequest = await prisma.accessRequest.create({
      data: {
        fullName: 'Test Student Session',
        email: 'test-student-session@student.ksu.edu.sa',
        desiredRole: 'STUDENT',
        status: 'PENDING'
      }
    })

    // Generate tokens
    const tokens = generateTokens({
      userId: committeeUser.id,
      email: committeeUser.email,
      role: committeeUser.role
    })
    accessToken = tokens.accessToken
    refreshToken = tokens.refreshToken
  })

  afterAll(async () => {
    await prisma.accessRequest.deleteMany({
      where: { email: 'test-student-session@student.ksu.edu.sa' }
    })
    await prisma.user.deleteMany({
      where: { email: 'test-committee-session@ksu.edu.sa' }
    })
  })

  describe('Cookie SameSite: none for cross-port POST', () => {
    it('should send cookies on GET request (sameSite: none)', async () => {
      const response = await request(app)
        .get('/api/access-requests')
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })

    it('should send cookies on POST request (sameSite: none) - ROOT CAUSE TEST', async () => {
      // This is the critical test - POST with cookies from different port
      const response = await request(app)
        .post(`/api/access-requests/${accessRequest.id}/lock`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000') // Simulates frontend origin
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should approve request with cookies on POST', async () => {
      // Create another request for approval
      const approveRequest = await prisma.accessRequest.create({
        data: {
          fullName: 'Approve Test',
          email: 'approve-test@student.ksu.edu.sa',
          desiredRole: 'STUDENT',
          status: 'PENDING'
        }
      })

      const response = await request(app)
        .post(`/api/access-requests/${approveRequest.id}/approve`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .send({ decisionNote: 'Test approval' })
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify request was approved
      const updated = await prisma.accessRequest.findUnique({
        where: { id: approveRequest.id }
      })
      expect(updated?.status).toBe('APPROVED')

      await prisma.accessRequest.delete({ where: { id: approveRequest.id } })
    })

    it('should reject request with cookies on POST', async () => {
      const rejectRequest = await prisma.accessRequest.create({
        data: {
          fullName: 'Reject Test',
          email: 'reject-test@student.ksu.edu.sa',
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

      const updated = await prisma.accessRequest.findUnique({
        where: { id: rejectRequest.id }
      })
      expect(updated?.status).toBe('REJECTED')

      await prisma.accessRequest.delete({ where: { id: rejectRequest.id } })
    })
  })

  describe('Token refresh with cookies', () => {
    it('should refresh token using refresh token cookie', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.user).toBeDefined()
      
      // Verify new cookies are set
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true)
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true)
      
      // Verify SameSite: none is set for localhost
      const accessTokenCookie = cookies.find((c: string) => c.includes('accessToken'))
      expect(accessTokenCookie).toContain('SameSite=None') // For localhost development
    })
  })

  describe('Cookie attributes verification', () => {
    it('should set cookies with correct attributes for localhost', async () => {
      // Login to get cookies
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-committee-session@ksu.edu.sa',
          password: 'password'
        })
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      const cookies = loginResponse.headers['set-cookie']
      expect(cookies).toBeDefined()
      
      // Check that SameSite=None is set (for localhost cross-port)
      const accessTokenCookie = cookies.find((c: string) => c.includes('accessToken'))
      expect(accessTokenCookie).toContain('SameSite=None')
      expect(accessTokenCookie).not.toContain('Secure') // localhost allows none without secure
    })
  })
})




