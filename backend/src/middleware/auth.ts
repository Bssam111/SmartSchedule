import { Request, Response, NextFunction } from 'express'
import { verifyToken, generateTokens, setTokenCookies } from '@/utils/jwt'
import { CustomError } from './errorHandler'
import { prisma } from '@/config/database'

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
  // Comprehensive logging for debugging session expiration issues
  const logContext = {
    method: req.method,
    originalUrl: req.originalUrl || req.url,
    path: req.path,
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']?.substring(0, 50),
    authHeader: req.headers.authorization ? 'Present' : 'Missing',
    authHeaderValue: req.headers.authorization?.substring(0, 30) + '...' || 'N/A',
    cookieAccessToken: req.cookies?.accessToken ? 'Present' : 'Missing',
    cookieRefreshToken: req.cookies?.refreshToken ? 'Present' : 'Missing',
    allCookies: Object.keys(req.cookies || {}),
    cookieCount: Object.keys(req.cookies || {}).length,
  }
  
  console.log('[AUTH] 🔍 Request received:', logContext)
  
  try {
    // Prefer cookies over Authorization header for better security and to avoid stale token issues
    // Cookies are automatically managed by the browser and updated by the server
    // Authorization header can contain stale tokens that cause refresh loops
    const token = req.cookies?.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      const reason = 'accessTokenMissing'
      console.warn('[AUTH] ❌ Session expired - No token found', {
        ...logContext,
        reason,
        details: {
          hasCookieAccessToken: !!req.cookies?.accessToken,
          hasAuthHeader: !!req.headers.authorization,
          cookieKeys: Object.keys(req.cookies || {}),
        }
      })
      throw new CustomError('Authentication required', 401)
    }

    try {
      const decoded = verifyToken(token)
      req.userId = decoded.userId
      // Map userId to id for consistency with route handlers
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
      
      console.log('[AUTH] ✅ Token verified successfully', {
        ...logContext,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        tokenSource: req.cookies?.accessToken ? 'cookie' : 'header',
        reqUserSet: !!req.user,
        reqUserId: req.user?.id,
      })
      
      next()
    } catch (tokenError) {
      console.log('[AUTH] ⚠️ Token verification failed', {
        ...logContext,
        errorType: tokenError instanceof Error ? tokenError.constructor.name : 'Unknown',
        errorMessage: tokenError instanceof Error ? tokenError.message : 'Unknown error',
        isCustomError: tokenError instanceof CustomError,
      })
      // Token expired or invalid - try to refresh using refresh token
      // Check if error is related to token expiration (either CustomError with 'expired' or jwt.ExpiredTokenError)
      const isExpiredError = tokenError instanceof CustomError && 
        (tokenError.message.includes('expired') || tokenError.message.includes('Invalid or expired token'))
      
      if (isExpiredError || (tokenError instanceof Error && tokenError.name === 'TokenExpiredError')) {
        const refreshToken = req.cookies?.refreshToken
        
        if (!refreshToken) {
          const reason = 'refreshTokenMissing'
          console.warn('[AUTH] ❌ Session expired - No refresh token available', {
            ...logContext,
            reason,
            tokenExpired: true,
            hasRefreshTokenCookie: !!req.cookies?.refreshToken,
          })
          throw new CustomError('Your session has expired. Please log out and log back in to refresh your session.', 401)
        }

        try {
          // Verify refresh token
          const refreshDecoded = verifyToken(refreshToken)
          
          // Verify user still exists
          const user = await prisma.user.findUnique({
            where: { id: refreshDecoded.userId },
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

          // Generate new tokens
          const { accessToken, refreshToken: newRefreshToken } = generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role
          })

          // Set new cookies
          setTokenCookies(res, accessToken, newRefreshToken)

          // Set user in request
          req.userId = user.id
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role
          }

          // Also set new access token in response header for client to update
          res.setHeader('X-New-Access-Token', accessToken)

          console.log('[AUTH] ✅ Token refreshed successfully', {
            ...logContext,
            userId: user.id,
            email: user.email,
            role: user.role,
            newTokensGenerated: true,
            cookiesSet: true,
            headerSet: 'X-New-Access-Token',
          })

          next()
        } catch (refreshError) {
          const reason = 'refreshTokenInvalid'
          const errorMsg = refreshError instanceof Error ? refreshError.message : 'Unknown error'
          console.warn('[AUTH] ❌ Session expired - Refresh token failed', {
            ...logContext,
            reason,
            refreshError: errorMsg,
            errorType: refreshError instanceof Error ? refreshError.constructor.name : 'Unknown',
            hasRefreshTokenCookie: !!req.cookies?.refreshToken,
          })
          throw new CustomError('Your session has expired. Please log out and log back in to refresh your session.', 401)
        }
      } else {
        // Token is invalid (not just expired)
        throw tokenError
      }
    }
  } catch (error) {
    if (error instanceof CustomError) {
      const reason = error.message.includes('expired') ? 'tokenExpired' : 
                     error.message.includes('required') ? 'authenticationRequired' :
                     error.message.includes('Invalid') ? 'tokenInvalid' : 'unknown'
      
      console.warn('[AUTH] ❌ Session expired - Returning 401', {
        method: req.method,
        originalUrl: req.originalUrl || req.url,
        reason,
        errorMessage: error.message,
        statusCode: error.statusCode || 401,
      })
      return next(error)
    }
    
    const reason = 'tokenVerificationFailed'
    console.warn('[AUTH] ❌ Session expired - Token verification exception', {
      method: req.method,
      originalUrl: req.originalUrl || req.url,
      reason,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    })
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
  
  // Admin has access to all features
  if (req.user.role !== 'FACULTY' && req.user.role !== 'COMMITTEE' && req.user.role !== 'ADMIN') {
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
  
  // Admin has access to all features
  if (req.user.role !== 'FACULTY' && req.user.role !== 'COMMITTEE' && req.user.role !== 'ADMIN') {
    return next(new CustomError('Faculty or Committee access required', 403))
  }
  
  next()
}

export const requireCommittee = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const logContext = {
    method: req.method,
    originalUrl: req.originalUrl || req.url,
    hasUser: !!req.user,
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    roleType: typeof req.user?.role,
  }
  
  if (!req.user) {
    console.warn('[AUTH] ❌ requireCommittee failed - No user in request', logContext)
    return next(new CustomError('Authentication required', 401))
  }
  
  // Admin has access to all committee features
  if (req.user.role !== 'COMMITTEE' && req.user.role !== 'ADMIN') {
    console.warn('[AUTH] ❌ requireCommittee failed - Role mismatch', {
      ...logContext,
      expectedRole: 'COMMITTEE or ADMIN',
      actualRole: req.user.role,
      roleComparison: req.user.role === 'COMMITTEE' ? 'exact match' : 'mismatch',
      roleUpperCase: req.user.role?.toUpperCase(),
      roleLowerCase: req.user.role?.toLowerCase(),
      roleStrictEqual: req.user.role === 'COMMITTEE',
      roleLooseEqual: req.user.role == 'COMMITTEE',
    })
    return next(new CustomError('Committee access required', 403))
  }
  
  console.log('[AUTH] ✅ requireCommittee passed', logContext)
  next()
}

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const logContext = {
    method: req.method,
    originalUrl: req.originalUrl || req.url,
    hasUser: !!req.user,
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
  }
  
  if (!req.user) {
    console.warn('[AUTH] ❌ requireAdmin failed - No user in request', logContext)
    return next(new CustomError('Authentication required', 401))
  }
  
  if (req.user.role !== 'ADMIN') {
    console.warn('[AUTH] ❌ requireAdmin failed - Role mismatch', {
      ...logContext,
      expectedRole: 'ADMIN',
      actualRole: req.user.role,
    })
    return next(new CustomError('Admin access required', 403))
  }
  
  console.log('[AUTH] ✅ requireAdmin passed', logContext)
  next()
}

