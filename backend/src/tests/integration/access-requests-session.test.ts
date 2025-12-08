/**
 * Integration tests for Access Requests session handling
 * Tests the complete flow: login, list, approve, reject with session persistence
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../server'
import { prisma } from '../../config/database'
import { generateTokens } from '../../utils/jwt'

describe('Access Requests Session Handling - Complete Flow', () => {
  let committeeUser: any
  let accessRequest1: any
  let accessRequest2: any
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
        universityId: 'COMMSESSION'
      }
    })

    // Create access requests
    accessRequest1 = await prisma.accessRequest.create({
      data: {
        fullName: 'Test Student 1',
        email: 'test-student1-session@student.ksu.edu.sa',
        desiredRole: 'STUDENT',
        status: 'PENDING'
      }
    })

    accessRequest2 = await prisma.accessRequest.create({
      data: {
        fullName: 'Test Student 2',
        email: 'test-student2-session@student.ksu.edu.sa',
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
      where: { 
        email: { 
          in: ['test-student1-session@student.ksu.edu.sa', 'test-student2-session@student.ksu.edu.sa'] 
        } 
      }
    })
    await prisma.user.deleteMany({
      where: { email: 'test-committee-session@ksu.edu.sa' }
    })
  })

  describe('Complete Session Flow', () => {
    it('should login and set cookies with SameSite=None', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-committee-session@ksu.edu.sa',
          password: 'password'
        })
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.body.success).toBe(true)
      
      // Verify cookies are set
      const cookies = response.headers['set-cookie']
      expect(cookies).toBeDefined()
      expect(cookies.some((c: string) => c.includes('accessToken'))).toBe(true)
      expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true)
      
      // Verify SameSite=None is set for localhost
      const accessCookie = cookies.find((c: string) => c.includes('accessToken'))
      expect(accessCookie).toContain('SameSite=None')
    })

    it('should list access requests with session cookie', async () => {
      const response = await request(app)
        .get('/api/access-requests')
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should approve request with session cookie (POST with SameSite=None)', async () => {
      const response = await request(app)
        .post(`/api/access-requests/${accessRequest1.id}/approve`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .send({ decisionNote: 'Test approval' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('approved')

      // Verify request was actually approved
      const updated = await prisma.accessRequest.findUnique({
        where: { id: accessRequest1.id }
      })
      expect(updated?.status).toBe('APPROVED')
    })

    it('should reject request with session cookie (POST with SameSite=None)', async () => {
      const response = await request(app)
        .post(`/api/access-requests/${accessRequest2.id}/reject`)
        .set('Cookie', `accessToken=${accessToken}`)
        .set('Origin', 'http://localhost:3000')
        .send({ decisionNote: 'Test rejection' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('rejected')

      // Verify request was actually rejected
      const updated = await prisma.accessRequest.findUnique({
        where: { id: accessRequest2.id }
      })
      expect(updated?.status).toBe('REJECTED')
    })
  })

  describe('Token Refresh Flow', () => {
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
    })
  })

  describe('Cookie Attributes Verification', () => {
    it('should set cookies with SameSite=None for localhost', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test-committee-session@ksu.edu.sa',
          password: 'password'
        })
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      const cookies = loginResponse.headers['set-cookie']
      const accessCookie = cookies.find((c: string) => c.includes('accessToken'))
      
      // Verify SameSite=None is set (allows cross-port POST)
      expect(accessCookie).toContain('SameSite=None')
      // Verify secure is false for localhost (browsers allow this)
      expect(accessCookie).not.toContain('Secure')
    })
  })
})




