import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { CustomError } from './errorHandler'

const DEFAULT_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://frontend-dev:3000'
]

const DEV_ORIGINS: string[] = Array.from(
  new Set(DEFAULT_ORIGINS.filter((origin): origin is string => Boolean(origin)))
)

// Enhanced security headers middleware
export const securityHeaders = helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...DEV_ORIGINS, "ws://localhost:3002"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
})

// Strict CORS configuration
export const strictCors = (req: Request, res: Response, next: NextFunction) => {
  const envOrigins = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || []
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : DEV_ORIGINS
  const origin = req.headers.origin
  const isDev = process.env.NODE_ENV === 'development'
  const isLocalhostOrigin = origin ? /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin) : false

  if (origin && (allowedOrigins.includes(origin) || (isDev && isLocalhostOrigin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (!origin && isDev) {
    // default to the first dev origin for non-browser tooling
    res.setHeader('Access-Control-Allow-Origin', DEV_ORIGINS[0] || 'http://localhost:3000')
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  next()
}

// Rate limiting configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // More lenient in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
})

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const strictApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window for sensitive endpoints
  message: {
    error: 'Rate limit exceeded for sensitive operations.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0')
    const maxBytes = parseSize(maxSize)

    if (contentLength > maxBytes) {
      throw new CustomError('Request entity too large', 413)
    }

    next()
  }
}

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from string inputs
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value)
      }
      return sanitized
    }
    return obj
  }

  if (req.body) {
    req.body = sanitizeObject(req.body)
  }

  if (req.query) {
    req.query = sanitizeObject(req.query)
  }

  next()
}

// File upload security
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  const maxFileSize = 5 * 1024 * 1024 // 5MB

  const files = (req as any).files
  if (files) {
    const fileArray = Array.isArray(files) ? files : Object.values(files).flat()
    
    for (const file of fileArray) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new CustomError('File type not allowed', 400)
      }
      
      if (file.size > maxFileSize) {
        throw new CustomError('File size too large', 400)
      }
    }
  }

  next()
}

// IP whitelist middleware (for admin operations)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      throw new CustomError('Access denied: IP not whitelisted', 403)
    }
    
    next()
  }
}

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString()
    }

    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.warn('Security Event:', JSON.stringify(logData))
    }

    // Log slow requests
    if (duration > 5000) {
      console.warn('Slow Request:', JSON.stringify(logData))
    }
  })

  next()
}

// Helper function to parse size strings
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  }

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/)
  if (!match) {
    throw new Error(`Invalid size format: ${size}`)
  }

  const value = parseFloat(match[1])
  const unit = match[2]
  
  return Math.floor(value * units[unit])
}

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Check for common patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters
    /123|abc|qwe|asd/i, // Sequential patterns
    /password|admin|user/i // Common words
  ]
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and is not secure')
      break
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Email validation with normalization
export const validateAndNormalizeEmail = (email: string): { isValid: boolean; normalized: string; errors: string[] } => {
  const errors: string[] = []
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format')
  }
  
  // Check for suspicious patterns
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    errors.push('Email contains invalid patterns')
  }
  
  // Normalize email
  const normalized = email.toLowerCase().trim()
  
  return {
    isValid: errors.length === 0,
    normalized,
    errors
  }
}
