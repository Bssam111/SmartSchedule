import { Request, Response, NextFunction } from 'express'

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
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    })
  }

  // Default error
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    statusCode: 500
  })
}

