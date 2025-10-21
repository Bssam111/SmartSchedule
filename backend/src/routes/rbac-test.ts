import { Router } from 'express'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { 
  requireUserRead, 
  requireUserCreate, 
  requireUserUpdate, 
  requireUserDelete,
  requireCourseCreate,
  requireCourseUpdate,
  requireCourseDelete,
  requireScheduleCreate,
  requireSchedulePublish,
  requireSystemLogs,
  requireSystemBackup
} from '@/middleware/rbac'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// Test RBAC endpoints
router.get('/test-rbac', authenticateToken, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'RBAC test endpoint accessible',
    user: req.user,
    timestamp: new Date().toISOString()
  })
})

// Test user permissions
router.get('/users', authenticateToken, requireUserRead, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'User read permission granted',
    user: req.user
  })
})

router.post('/users', authenticateToken, requireUserCreate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'User create permission granted',
    user: req.user
  })
})

router.put('/users/:id', authenticateToken, requireUserUpdate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'User update permission granted',
    user: req.user,
    targetId: req.params.id
  })
})

router.delete('/users/:id', authenticateToken, requireUserDelete, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'User delete permission granted',
    user: req.user,
    targetId: req.params.id
  })
})

// Test course permissions
router.post('/courses', authenticateToken, requireCourseCreate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Course create permission granted',
    user: req.user
  })
})

router.put('/courses/:id', authenticateToken, requireCourseUpdate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Course update permission granted',
    user: req.user,
    targetId: req.params.id
  })
})

router.delete('/courses/:id', authenticateToken, requireCourseDelete, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Course delete permission granted',
    user: req.user,
    targetId: req.params.id
  })
})

// Test schedule permissions
router.post('/schedules', authenticateToken, requireScheduleCreate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Schedule create permission granted',
    user: req.user
  })
})

router.patch('/schedules/:id/publish', authenticateToken, requireSchedulePublish, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'Schedule publish permission granted',
    user: req.user,
    targetId: req.params.id
  })
})

// Test system permissions
router.get('/system/logs', authenticateToken, requireSystemLogs, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'System logs permission granted',
    user: req.user,
    logs: [
      { id: 1, message: 'System started', timestamp: new Date().toISOString() },
      { id: 2, message: 'User logged in', timestamp: new Date().toISOString() }
    ]
  })
})

router.post('/system/backup', authenticateToken, requireSystemBackup, (req: AuthRequest, res) => {
  res.json({
    success: true,
    message: 'System backup permission granted',
    user: req.user,
    backupId: 'backup_' + Date.now()
  })
})

// Test permission matrix
router.get('/permissions', authenticateToken, (req: AuthRequest, res) => {
  const userRole = req.user?.role
  
  const permissions = {
    STUDENT: {
      'users:read:self': true,
      'users:read:any': false,
      'users:create': false,
      'users:update:self': true,
      'users:update:any': false,
      'users:delete:any': false,
      'courses:read': true,
      'courses:create': false,
      'courses:update': false,
      'courses:delete': false,
      'schedules:read': true,
      'schedules:create': false,
      'schedules:publish': false,
      'system:logs': false,
      'system:backup': false
    },
    FACULTY: {
      'users:read:self': true,
      'users:read:any': false,
      'users:create': false,
      'users:update:self': true,
      'users:update:any': false,
      'users:delete:any': false,
      'courses:read': true,
      'courses:create': false,
      'courses:update': false,
      'courses:delete': false,
      'schedules:read': true,
      'schedules:create': false,
      'schedules:publish': false,
      'system:logs': false,
      'system:backup': false
    },
    COMMITTEE: {
      'users:read:self': true,
      'users:read:any': true,
      'users:create': true,
      'users:update:self': true,
      'users:update:any': true,
      'users:delete:any': true,
      'courses:read': true,
      'courses:create': true,
      'courses:update': true,
      'courses:delete': true,
      'schedules:read': true,
      'schedules:create': true,
      'schedules:publish': true,
      'system:logs': true,
      'system:backup': true
    }
  }

  res.json({
    success: true,
    user: req.user,
    permissions: permissions[userRole as keyof typeof permissions] || {},
    role: userRole
  })
})

export { router as rbacTestRoutes }
