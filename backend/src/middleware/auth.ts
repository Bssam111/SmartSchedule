import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '@/config/database'
import { CustomError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      throw new CustomError('Access token required', 401)
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      throw new CustomError('User not found', 401)
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new CustomError('Invalid token', 401))
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new CustomError('Token expired', 401))
    }
    next(error)
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new CustomError('Authentication required', 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new CustomError('Insufficient permissions', 403))
    }

    next()
  }
}

export const requireStudent = requireRole(['STUDENT'])
export const requireFaculty = requireRole(['FACULTY'])
export const requireCommittee = requireRole(['COMMITTEE'])
export const requireFacultyOrCommittee = requireRole(['FACULTY', 'COMMITTEE'])
