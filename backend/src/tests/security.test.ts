import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../server'
import { prisma } from '@/config/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

describe('Security Tests', () => {
  let studentToken: string
  let facultyToken: string
  let committeeToken: string
  let studentId: string
  let facultyId: string
  let committeeId: string

  beforeEach(async () => {
    // Clean up test data
    await prisma.securityLog.deleteMany()
    await prisma.user.deleteMany()

    // Create test users
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12)

    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        password: hashedPassword,
        name: 'Test Student',
        role: 'STUDENT',
        universityId: 'STU001'
      }
    })

    const faculty = await prisma.user.create({
      data: {
        email: 'faculty@test.com',
        password: hashedPassword,
        name: 'Test Faculty',
        role: 'FACULTY',
        universityId: 'FAC001'
      }
    })

    const committee = await prisma.user.create({
      data: {
        email: 'committee@test.com',
        password: hashedPassword,
        name: 'Test Committee',
        role: 'COMMITTEE',
        universityId: 'COM001'
      }
    })

    studentId = student.id
    facultyId = faculty.id
    committeeId = committee.id

    // Generate tokens
    studentToken = jwt.sign(
      { userId: studentId, email: student.email, role: 'STUDENT' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    facultyToken = jwt.sign(
      { userId: facultyId, email: faculty.email, role: 'FACULTY' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    committeeToken = jwt.sign(
      { userId: committeeId, email: committee.email, role: 'COMMITTEE' },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )
  })

  afterEach(async () => {
    await prisma.securityLog.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('RBAC Tests', () => {
    it('should allow students to read their own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(studentId)
    })

    it('should deny students from reading other users profiles', async () => {
      await request(app)
        .get(`/api/users/${facultyId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)
    })

    it('should allow committee to read any user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${studentId}`)
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should deny students from creating users', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'NewPassword123!',
        name: 'New User',
        role: 'STUDENT',
        universityId: 'NEW001'
      }

      await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newUser)
        .expect(403)
    })

    it('should allow committee to create users', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'NewPassword123!',
        name: 'New User',
        role: 'STUDENT',
        universityId: 'NEW001'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newUser)
        .expect(201)

      expect(response.body.success).toBe(true)
    })
  })

  describe('Input Validation Tests', () => {
    it('should reject weak passwords', async () => {
      const weakPasswordUser = {
        email: 'weak@test.com',
        password: '123',
        name: 'Weak User',
        role: 'STUDENT',
        universityId: 'WEAK001'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordUser)
        .expect(400)

      expect(response.body.error).toContain('Password must be at least 12 characters')
    })

    it('should reject invalid email formats', async () => {
      const invalidEmailUser = {
        email: 'invalid-email',
        password: 'ValidPassword123!',
        name: 'Invalid User',
        role: 'STUDENT',
        universityId: 'INV001'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailUser)
        .expect(400)

      expect(response.body.error).toContain('Invalid email address')
    })

    it('should reject malicious input', async () => {
      const maliciousUser = {
        email: 'malicious@test.com',
        password: 'ValidPassword123!',
        name: '<script>alert("xss")</script>',
        role: 'STUDENT',
        universityId: 'MAL001'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousUser)
        .expect(400)

      expect(response.body.error).toContain('Name contains invalid characters')
    })

    it('should reject oversized requests', async () => {
      const oversizedData = {
        email: 'oversized@test.com',
        password: 'ValidPassword123!',
        name: 'A'.repeat(1000), // Very long name
        role: 'STUDENT',
        universityId: 'OVER001'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(oversizedData)
        .expect(400)

      expect(response.body.error).toContain('Name too long')
    })
  })

  describe('Rate Limiting Tests', () => {
    it('should rate limit authentication attempts', async () => {
      const loginData = {
        email: 'student@test.com',
        password: 'WrongPassword',
        role: 'STUDENT'
      }

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401)
      }

      // Should be rate limited
      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429)
    })

    it('should rate limit API requests', async () => {
      // Make many requests to trigger rate limiting
      const promises = []
      for (let i = 0; i < 101; i++) {
        promises.push(
          request(app)
            .get('/api/health')
            .expect(200)
        )
      }

      await Promise.all(promises)

      // Next request should be rate limited
      await request(app)
        .get('/api/health')
        .expect(429)
    })
  })

  describe('Security Headers Tests', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
      expect(response.headers['x-xss-protection']).toBe('0')
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000')
    })

    it('should include CSP headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.headers['content-security-policy']).toContain("default-src 'self'")
    })
  })

  describe('JWT Security Tests', () => {
    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: studentId, email: 'student@test.com', role: 'STUDENT' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Expired token
      )

      await request(app)
        .get(`/api/users/${studentId}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
    })

    it('should reject tokens with invalid signatures', async () => {
      const invalidToken = jwt.sign(
        { userId: studentId, email: 'student@test.com', role: 'STUDENT' },
        'wrong-secret'
      )

      await request(app)
        .get(`/api/users/${studentId}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)
    })

    it('should reject tokens without required claims', async () => {
      const incompleteToken = jwt.sign(
        { userId: studentId }, // Missing email and role
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      await request(app)
        .get(`/api/users/${studentId}`)
        .set('Authorization', `Bearer ${incompleteToken}`)
        .expect(401)
    })
  })

  describe('Audit Logging Tests', () => {
    it('should log unauthorized access attempts', async () => {
      await request(app)
        .get(`/api/users/${facultyId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)

      const securityLogs = await prisma.securityLog.findMany({
        where: {
          userId: studentId,
          action: 'unauthorized_access_attempt'
        }
      })

      expect(securityLogs).toHaveLength(1)
      expect(securityLogs[0].resource).toBe('users')
      expect(securityLogs[0].actionType).toBe('read:any')
    })

    it('should log authorized privileged actions', async () => {
      const newUser = {
        email: 'newuser@test.com',
        password: 'NewPassword123!',
        name: 'New User',
        role: 'STUDENT',
        universityId: 'NEW001'
      }

      await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newUser)
        .expect(201)

      const securityLogs = await prisma.securityLog.findMany({
        where: {
          userId: committeeId,
          action: 'authorized_access'
        }
      })

      expect(securityLogs.length).toBeGreaterThan(0)
    })
  })

  describe('CORS Security Tests', () => {
    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-site.com')
        .expect(200)

      // Should not include CORS headers for unauthorized origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('should allow requests from authorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200)

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
    })
  })

  describe('SQL Injection Prevention Tests', () => {
    it('should prevent SQL injection in user queries', async () => {
      const maliciousId = "'; DROP TABLE users; --"
      
      await request(app)
        .get(`/api/users/${maliciousId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404) // Should not find user, not crash
    })

    it('should prevent SQL injection in search parameters', async () => {
      const maliciousQuery = "'; DROP TABLE users; --"
      
      await request(app)
        .get(`/api/users?search=${maliciousQuery}`)
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(400) // Should be rejected by validation
    })
  })

  describe('XSS Prevention Tests', () => {
    it('should sanitize user input', async () => {
      const maliciousUser = {
        email: 'xss@test.com',
        password: 'ValidPassword123!',
        name: '<script>alert("xss")</script>',
        role: 'STUDENT',
        universityId: 'XSS001'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousUser)
        .expect(400)

      expect(response.body.error).toContain('Name contains invalid characters')
    })
  })
})
