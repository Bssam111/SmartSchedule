import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../server'
import { prisma } from '@/config/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

describe('SmartSchedule Integration Tests', () => {
  let studentToken: string
  let facultyToken: string
  let committeeToken: string
  let studentId: string
  let facultyId: string
  let committeeId: string

  beforeEach(async () => {
    // Clean up test data
    await prisma.securityLog.deleteMany()
    await prisma.assignment.deleteMany()
    await prisma.section.deleteMany()
    await prisma.course.deleteMany()
    await prisma.schedule.deleteMany()
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
    await prisma.assignment.deleteMany()
    await prisma.section.deleteMany()
    await prisma.course.deleteMany()
    await prisma.schedule.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('Complete User Workflow', () => {
    it('should handle complete student registration and login flow', async () => {
      // Register new student
      const newStudent = {
        email: 'newstudent@test.com',
        password: 'NewPassword123!',
        name: 'New Student',
        role: 'STUDENT',
        universityId: 'NEW001'
      }

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newStudent)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)
      expect(registerResponse.body.user.email).toBe(newStudent.email)

      // Login with new student
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: newStudent.email,
          password: newStudent.password,
          role: 'STUDENT'
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      expect(loginResponse.body.user.email).toBe(newStudent.email)
    })

    it('should handle complete course management workflow', async () => {
      // Committee creates course
      const newCourse = {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        levelId: 'level1'
      }

      const courseResponse = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newCourse)
        .expect(201)

      expect(courseResponse.body.success).toBe(true)
      const courseId = courseResponse.body.data.id

      // Committee creates section
      const newSection = {
        courseId: courseId,
        instructorId: facultyId,
        roomId: null,
        capacity: 30
      }

      const sectionResponse = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newSection)
        .expect(201)

      expect(sectionResponse.body.success).toBe(true)
      const sectionId = sectionResponse.body.data.id

      // Committee creates schedule
      const newSchedule = {
        name: 'Fall 2024 Schedule',
        status: 'DRAFT'
      }

      const scheduleResponse = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newSchedule)
        .expect(201)

      expect(scheduleResponse.body.success).toBe(true)
      const scheduleId = scheduleResponse.body.data.id

      // Committee assigns student to section
      const assignment = {
        studentId: studentId,
        sectionId: sectionId,
        courseId: courseId
      }

      const assignmentResponse = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(assignment)
        .expect(201)

      expect(assignmentResponse.body.success).toBe(true)

      // Student can view their assignments
      const studentAssignments = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(studentAssignments.body.success).toBe(true)
    })

    it('should handle complete feedback workflow', async () => {
      // Student creates feedback
      const feedback = {
        content: 'Great course! Very informative and well-structured.',
        rating: 5,
        scheduleId: null
      }

      const feedbackResponse = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(feedback)
        .expect(201)

      expect(feedbackResponse.body.success).toBe(true)

      // Committee can view all feedback
      const allFeedback = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(200)

      expect(allFeedback.body.success).toBe(true)
      expect(allFeedback.body.data.length).toBeGreaterThan(0)
    })
  })

  describe('Security Integration Tests', () => {
    it('should maintain security across all endpoints', async () => {
      // Test that security headers are present
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.headers['strict-transport-security']).toBeDefined()
      expect(response.headers['x-frame-options']).toBeDefined()
      expect(response.headers['x-content-type-options']).toBeDefined()
      expect(response.headers['content-security-policy']).toBeDefined()
    })

    it('should log security events properly', async () => {
      // Attempt unauthorized access
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)

      // Check that security event was logged
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

    it('should handle rate limiting properly', async () => {
      // Make multiple requests to trigger rate limiting
      const promises = []
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrong',
              role: 'STUDENT'
            })
        )
      }

      const responses = await Promise.all(promises)
      
      // At least one should be rate limited
      const rateLimited = responses.some(response => response.status === 429)
      expect(rateLimited).toBe(true)
    })
  })

describe('End-to-End Security Tests', () => {
    it('should prevent privilege escalation', async () => {
      // Create a token with elevated role but user is still student
      const elevatedToken = jwt.sign(
        { userId: studentId, email: 'student@test.com', role: 'COMMITTEE' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      // Should still be denied because actual user role is STUDENT
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${elevatedToken}`)
        .expect(403)
    })

    it('should handle concurrent requests safely', async () => {
      // Make multiple concurrent requests
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/health')
            .expect(200)
        )
      }

      const responses = await Promise.all(promises)
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should maintain data consistency under load', async () => {
      // Create multiple users concurrently
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/auth/register')
            .send({
              email: `concurrent${i}@test.com`,
              password: 'ConcurrentTest123!',
              name: `Concurrent User ${i}`,
              role: 'STUDENT',
              universityId: `CONC${i}`
            })
        )
      }

      const responses = await Promise.all(promises)
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })

      // Verify all users were created
      const userCount = await prisma.user.count({
        where: {
          email: {
            startsWith: 'concurrent'
          }
        }
      })

      expect(userCount).toBe(5)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      // Test with invalid data that would cause database error
      const invalidData = {
        email: 'invalid@test.com',
        password: 'ValidPassword123!',
        name: 'A'.repeat(1000), // Too long name
        role: 'STUDENT',
        universityId: 'INV001'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400)

      expect(response.body.error).toContain('Name too long')
    })

    it('should handle network errors gracefully', async () => {
      // Test with malformed JSON
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@test.com", "password": "test", "role": "STUDENT"') // Missing closing brace
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      // Create multiple courses
      const courses = []
      for (let i = 0; i < 100; i++) {
        courses.push({
          code: `CS${i.toString().padStart(3, '0')}`,
          name: `Computer Science ${i}`,
          credits: 3,
          levelId: 'level1'
        })
      }

      // Create all courses
      for (const course of courses) {
        await request(app)
          .post('/api/courses')
          .set('Authorization', `Bearer ${committeeToken}`)
          .send(course)
          .expect(201)
      }

      // Retrieve all courses
      const startTime = Date.now()
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(200)
      const endTime = Date.now()

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBe(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
    })
  })
})
