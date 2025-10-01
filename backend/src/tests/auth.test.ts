import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import app from '../server'
import { prisma } from '@/config/database'
import bcrypt from 'bcryptjs'

describe('Authentication', () => {
  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 12)
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'STUDENT'
      }
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'STUDENT'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.user).toBeDefined()
      expect(response.headers['set-cookie']).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
          role: 'STUDENT'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'FACULTY'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          role: 'STUDENT'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.user).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Another User',
          role: 'STUDENT'
        })

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          role: 'STUDENT'
        })

      const cookies = loginResponse.headers['set-cookie']

      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookies)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.user).toBeDefined()
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })
})
