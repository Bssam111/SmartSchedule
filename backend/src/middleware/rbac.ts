import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'
import { CustomError } from './errorHandler'

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401))
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new CustomError(`Access denied. Required role: ${allowedRoles.join(' or ')}`, 403))
    }
    
    next()
  }
}

export const requireUserRead = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401))
  }
  
  // Allow all authenticated users to read user list (with filtered data)
  // Committee gets full access, others get limited data
  next()
}

export const requireAdmin = requireRole('COMMITTEE')
export const requireStudent = requireRole('STUDENT')
export const requireFaculty = requireRole('FACULTY', 'COMMITTEE')

