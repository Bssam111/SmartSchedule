import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import { CustomError } from './errorHandler'
import { prisma } from '@/config/database'

// Define resource-action permissions matrix
export interface Permission {
  resource: string
  action: string
  roles: string[]
}

// RBAC Policy Matrix
export const RBAC_POLICIES: Permission[] = [
  // User management
  { resource: 'users', action: 'read:self', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'users', action: 'read:any', roles: ['COMMITTEE'] },
  { resource: 'users', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'users', action: 'update:self', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'users', action: 'update:any', roles: ['COMMITTEE'] },
  { resource: 'users', action: 'delete:any', roles: ['COMMITTEE'] },

  // Course management
  { resource: 'courses', action: 'read', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'courses', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'courses', action: 'update', roles: ['COMMITTEE'] },
  { resource: 'courses', action: 'delete', roles: ['COMMITTEE'] },

  // Section management
  { resource: 'sections', action: 'read', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'sections', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'sections', action: 'update', roles: ['FACULTY', 'COMMITTEE'] },
  { resource: 'sections', action: 'delete', roles: ['COMMITTEE'] },
  { resource: 'sections', action: 'enroll', roles: ['STUDENT', 'COMMITTEE'] },
  { resource: 'sections', action: 'unenroll', roles: ['STUDENT', 'COMMITTEE'] },

  // Schedule management
  { resource: 'schedules', action: 'read', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'schedules', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'schedules', action: 'update', roles: ['COMMITTEE'] },
  { resource: 'schedules', action: 'delete', roles: ['COMMITTEE'] },
  { resource: 'schedules', action: 'publish', roles: ['COMMITTEE'] },
  { resource: 'schedules', action: 'approve', roles: ['COMMITTEE'] },

  // Room management
  { resource: 'rooms', action: 'read', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'rooms', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'rooms', action: 'update', roles: ['COMMITTEE'] },
  { resource: 'rooms', action: 'delete', roles: ['COMMITTEE'] },

  // Faculty assignments
  { resource: 'assignments', action: 'read', roles: ['FACULTY', 'COMMITTEE'] },
  { resource: 'assignments', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'assignments', action: 'update', roles: ['COMMITTEE'] },
  { resource: 'assignments', action: 'delete', roles: ['COMMITTEE'] },

  // Feedback and notifications
  { resource: 'feedback', action: 'read', roles: ['COMMITTEE'] },
  { resource: 'feedback', action: 'create', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'feedback', action: 'update', roles: ['COMMITTEE'] },
  { resource: 'feedback', action: 'delete', roles: ['COMMITTEE'] },

  { resource: 'notifications', action: 'read', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'notifications', action: 'create', roles: ['COMMITTEE'] },
  { resource: 'notifications', action: 'update', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'notifications', action: 'delete', roles: ['COMMITTEE'] },

  // Preferences
  { resource: 'preferences', action: 'read:self', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'preferences', action: 'read:any', roles: ['COMMITTEE'] },
  { resource: 'preferences', action: 'create', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'preferences', action: 'update:self', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'preferences', action: 'update:any', roles: ['COMMITTEE'] },
  { resource: 'preferences', action: 'delete:self', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'preferences', action: 'delete:any', roles: ['COMMITTEE'] },

  // System administration
  { resource: 'system', action: 'health', roles: ['STUDENT', 'FACULTY', 'COMMITTEE'] },
  { resource: 'system', action: 'logs', roles: ['COMMITTEE'] },
  { resource: 'system', action: 'backup', roles: ['COMMITTEE'] },
  { resource: 'system', action: 'maintenance', roles: ['COMMITTEE'] }
]

// Check if user has permission for resource-action
export const hasPermission = (userRole: string, resource: string, action: string): boolean => {
  const permission = RBAC_POLICIES.find(
    p => p.resource === resource && p.action === action
  )
  
  if (!permission) {
    return false // Default deny
  }
  
  return permission.roles.includes(userRole)
}

// RBAC middleware factory
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401)
      }

      // Check permission
      if (!hasPermission(req.user.role, resource, action)) {
        // Log unauthorized access attempt
        await logSecurityEvent({
          userId: req.user.id,
          action: 'unauthorized_access_attempt',
          resource,
          actionType: action,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: {
            userRole: req.user.role,
            requestedResource: resource,
            requestedAction: action
          }
        })

        throw new CustomError('Insufficient permissions', 403)
      }

      // Log authorized access for sensitive operations
      if (['create', 'update', 'delete', 'publish', 'approve'].includes(action)) {
        await logSecurityEvent({
          userId: req.user.id,
          action: 'authorized_access',
          resource,
          actionType: action,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: {
            userRole: req.user.role,
            resource,
            action
          }
        })
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Resource ownership check middleware
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new CustomError('Authentication required', 401)
      }

      const resourceId = req.params[resourceIdParam]
      
      // Committee members can access any resource
      if (req.user.role === 'COMMITTEE') {
        return next()
      }

      // For self-access, check if the resource belongs to the user
      if (req.user.id !== resourceId) {
        throw new CustomError('Access denied: Resource does not belong to user', 403)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Audit logging interface
interface SecurityEvent {
  userId: string
  action: string
  resource: string
  actionType: string
  ip: string
  userAgent: string | undefined
  details: Record<string, any>
}

// Log security events to database
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    await prisma.securityLog.create({
      data: {
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        actionType: event.actionType,
        ip: event.ip,
        userAgent: event.userAgent || '',
        details: event.details,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
    // Don't throw error to avoid breaking the main flow
  }
}

// Predefined permission checkers for common operations
export const requireUserRead = requirePermission('users', 'read:any')
export const requireUserCreate = requirePermission('users', 'create')
export const requireUserUpdate = requirePermission('users', 'update:any')
export const requireUserDelete = requirePermission('users', 'delete:any')

export const requireCourseCreate = requirePermission('courses', 'create')
export const requireCourseUpdate = requirePermission('courses', 'update')
export const requireCourseDelete = requirePermission('courses', 'delete')

export const requireSectionCreate = requirePermission('sections', 'create')
export const requireSectionUpdate = requirePermission('sections', 'update')
export const requireSectionDelete = requirePermission('sections', 'delete')

export const requireScheduleCreate = requirePermission('schedules', 'create')
export const requireScheduleUpdate = requirePermission('schedules', 'update')
export const requireScheduleDelete = requirePermission('schedules', 'delete')
export const requireSchedulePublish = requirePermission('schedules', 'publish')

export const requireRoomCreate = requirePermission('rooms', 'create')
export const requireRoomUpdate = requirePermission('rooms', 'update')
export const requireRoomDelete = requirePermission('rooms', 'delete')

export const requireFeedbackRead = requirePermission('feedback', 'read')
export const requireFeedbackCreate = requirePermission('feedback', 'create')
export const requireFeedbackUpdate = requirePermission('feedback', 'update')
export const requireFeedbackDelete = requirePermission('feedback', 'delete')

export const requireSystemLogs = requirePermission('system', 'logs')
export const requireSystemBackup = requirePermission('system', 'backup')
export const requireSystemMaintenance = requirePermission('system', 'maintenance')
