import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@/utils/jwt'
import { CustomError } from './errorHandler'

export interface AuthRequest extends Request {
  userId?: string
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.accessToken

    if (!token) {
      throw new CustomError('Authentication required', 401)
    }

    const decoded = verifyToken(token)
    req.userId = decoded.userId
    req.user = decoded as any
    
    next()
  } catch (error) {
    if (error instanceof CustomError) {
      return next(error)
    }
    next(new CustomError('Invalid or expired token', 401))
  }
}

export const requireFaculty = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401))
  }
  
  if (req.user.role !== 'FACULTY' && req.user.role !== 'COMMITTEE') {
    return next(new CustomError('Faculty access required', 403))
  }
  
  next()
}

export const requireFacultyOrCommittee = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401))
  }
  
  if (req.user.role !== 'FACULTY' && req.user.role !== 'COMMITTEE') {
    return next(new CustomError('Faculty or Committee access required', 403))
  }
  
  next()
}

export const requireCommittee = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new CustomError('Authentication required', 401))
  }
  
  if (req.user.role !== 'COMMITTEE') {
    return next(new CustomError('Committee access required', 403))
  }
  
  next()
}

