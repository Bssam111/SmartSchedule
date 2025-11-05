import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export class CustomError extends Error implements AppError {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal Server Error'

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409
        message = 'A record with this information already exists'
        break
      case 'P2025':
        statusCode = 404
        message = 'Record not found'
        break
      case 'P2003':
        statusCode = 400
        message = 'Invalid reference to related record'
        break
      default:
        statusCode = 500
        message = 'Database operation failed'
    }
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400
    message = 'Validation failed'
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
    
    return res.status(statusCode).json({
      success: false,
      error: message,
      details: errors
    })
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params
    })
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  })
}
