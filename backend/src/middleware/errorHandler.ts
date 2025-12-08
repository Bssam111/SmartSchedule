import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class CustomError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational = true
  ) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, CustomError.prototype)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export const errorHandler = (
  err: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorMessages = err.errors.map(e => {
      // Format path for better readability
      const path = e.path.length > 0 ? `${e.path.join('.')}: ` : ''
      return `${path}${e.message}`
    })
    
    return res.status(400).json({
      success: false,
      error: errorMessages.join('. '),
      message: errorMessages.join('. '),
      statusCode: 400,
      issues: err.errors
    })
  }

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      message: err.message,
      statusCode: err.statusCode
    })
  }

  // Default error
  console.error('Unhandled error:', err)
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message
  
  res.status(500).json({
    success: false,
    error: errorMessage,
    message: errorMessage,
    statusCode: 500
  })
}

