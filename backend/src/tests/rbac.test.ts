import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../server'
import { prisma } from '@/config/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

describe('RBAC Integration Tests', () => {
  let studentToken: string
  let facultyToken: string
  let committeeToken: string
  let studentId: string
  let facultyId: string
  let committeeId: string
  let courseId: string
  let sectionId: string
  let scheduleId: string

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

    // Create test course
    const course = await prisma.course.create({
      data: {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        levelId: 'level1'
      }
    })
    courseId = course.id

    // Create test section
    const section = await prisma.section.create({
      data: {
        name: 'CS101-01',
        courseId: courseId,
        instructorId: facultyId,
        roomId: null
      }
    })
    sectionId = section.id

    // Create test schedule
    const schedule = await prisma.schedule.create({
      data: {
        name: 'Fall 2024 Schedule',
        status: 'DRAFT'
      }
    })
    scheduleId = schedule.id
  })

  afterEach(async () => {
    await prisma.securityLog.deleteMany()
    await prisma.assignment.deleteMany()
    await prisma.section.deleteMany()
    await prisma.course.deleteMany()
    await prisma.schedule.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('Course Management Permissions', () => {
    it('should allow committee to create courses', async () => {
      const newCourse = {
        code: 'CS102',
        name: 'Data Structures',
        credits: 4,
        levelId: 'level1'
      }

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newCourse)
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should deny students from creating courses', async () => {
      const newCourse = {
        code: 'CS102',
        name: 'Data Structures',
        credits: 4,
        levelId: 'level1'
      }

      await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newCourse)
        .expect(403)
    })

    it('should allow all roles to read courses', async () => {
      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
    })
  })

  describe('Section Management Permissions', () => {
    it('should allow committee to create sections', async () => {
      const newSection = {
        courseId: courseId,
        instructorId: facultyId,
        roomId: null,
        capacity: 30
      }

      const response = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newSection)
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should allow faculty to update their sections', async () => {
      const updateData = {
        capacity: 25
      }

      const response = await request(app)
        .put(`/api/sections/${sectionId}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should deny students from creating sections', async () => {
      const newSection = {
        courseId: courseId,
        instructorId: facultyId,
        roomId: null,
        capacity: 30
      }

      await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSection)
        .expect(403)
    })
  })

  describe('Schedule Management Permissions', () => {
    it('should allow committee to create schedules', async () => {
      const newSchedule = {
        name: 'Spring 2025 Schedule',
        status: 'DRAFT'
      }

      const response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newSchedule)
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should allow committee to publish schedules', async () => {
      const response = await request(app)
        .patch(`/api/schedules/${scheduleId}/publish`)
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should deny students from creating schedules', async () => {
      const newSchedule = {
        name: 'Spring 2025 Schedule',
        status: 'DRAFT'
      }

      await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newSchedule)
        .expect(403)
    })

    it('should allow all roles to read schedules', async () => {
      const response = await request(app)
        .get('/api/schedules')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('User Management Permissions', () => {
    it('should allow committee to read all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(3) // student, faculty, committee
    })

    it('should deny students from reading all users', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)
    })

    it('should allow users to read their own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(studentId)
    })

    it('should deny users from reading other users profiles', async () => {
      await request(app)
        .get(`/api/users/${facultyId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)
    })
  })

  describe('Assignment Management Permissions', () => {
    it('should allow committee to create assignments', async () => {
      const newAssignment = {
        studentId: studentId,
        sectionId: sectionId,
        courseId: courseId
      }

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${committeeToken}`)
        .send(newAssignment)
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should allow faculty to read assignments', async () => {
      const response = await request(app)
        .get('/api/assignments')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should deny students from creating assignments', async () => {
      const newAssignment = {
        studentId: studentId,
        sectionId: sectionId,
        courseId: courseId
      }

      await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(newAssignment)
        .expect(403)
    })
  })

  describe('Feedback Management Permissions', () => {
    it('should allow all roles to create feedback', async () => {
      const feedback = {
        content: 'Great course!',
        rating: 5,
        scheduleId: scheduleId
      }

      const response = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(feedback)
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should allow only committee to read all feedback', async () => {
      const response = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should deny students from reading all feedback', async () => {
      await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)
    })
  })

  describe('System Administration Permissions', () => {
    it('should allow all roles to access health check', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should allow only committee to access system logs', async () => {
      const response = await request(app)
        .get('/api/system/logs')
        .set('Authorization', `Bearer ${committeeToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should deny students from accessing system logs', async () => {
      await request(app)
        .get('/api/system/logs')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403)
    })
  })

  describe('Resource Ownership Tests', () => {
    it('should allow users to update their own preferences', async () => {
      const preference = {
        type: 'theme',
        value: 'dark'
      }

      const response = await request(app)
        .post('/api/preferences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(preference)
        .expect(201)

      expect(response.body.success).toBe(true)
    })

    it('should deny users from updating other users preferences', async () => {
      const preference = {
        type: 'theme',
        value: 'dark'
      }

      await request(app)
        .post('/api/preferences')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ ...preference, userId: facultyId })
        .expect(403)
    })
  })

  describe('Permission Escalation Prevention', () => {
    it('should not allow role escalation through user updates', async () => {
      const updateData = {
        role: 'COMMITTEE'
      }

      await request(app)
        .put(`/api/users/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(403)
    })

    it('should not allow privilege escalation through token manipulation', async () => {
      // Create a token with elevated role
      const elevatedToken = jwt.sign(
        { userId: studentId, email: 'student@test.com', role: 'COMMITTEE' },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      )

      // The system should still deny access based on actual user role in database
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${elevatedToken}`)
        .expect(403)
    })
  })
})
