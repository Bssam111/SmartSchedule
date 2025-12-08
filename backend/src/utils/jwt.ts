import jwt from 'jsonwebtoken'
import { Response } from 'express'
import { CustomError } from '@/middleware/errorHandler'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-not-for-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export const generateTokens = (payload: TokenPayload) => {
  const secret: string = String(JWT_SECRET || 'dev-secret-key-not-for-production')
  
  const accessToken = jwt.sign(
    payload,
    secret,
    {
      expiresIn: String(JWT_EXPIRES_IN || '7d')
    } as jwt.SignOptions
  )

  const refreshToken = jwt.sign(
    { userId: payload.userId },
    secret,
    {
      expiresIn: String(JWT_REFRESH_EXPIRES_IN || '30d')
    } as jwt.SignOptions
  )

  return { accessToken, refreshToken }
}

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as TokenPayload
    return decoded
  } catch (error) {
    throw new CustomError('Invalid or expired token', 401)
  }
}

export const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isLocalhost = process.env.NODE_ENV === 'development' || !isProduction
  
  // For localhost: secure=false, sameSite='lax'
  // For production: secure=true, sameSite='none' (for cross-origin) or 'lax' (same-origin)
  const secure = isLocalhost ? false : (process.env.SESSION_COOKIE_SECURE === 'true' || isProduction)
  const sameSite = isLocalhost 
    ? 'lax' 
    : ((process.env.SESSION_COOKIE_SAMESITE as 'lax' | 'none' | 'strict') || (isProduction ? 'none' : 'lax'))
  
  // Get domain from environment variable if set (for cross-domain cookies in production)
  // If not set, cookies will be set for the current domain
  const domain = process.env.SESSION_COOKIE_DOMAIN || undefined
  
  // Cookie options
  const cookieOptions: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'lax' | 'none' | 'strict'
    maxAge: number
    path: string
    domain?: string
  } = {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  }
  
  // Only set domain if explicitly configured (for cross-domain scenarios)
  // Setting domain incorrectly can prevent cookies from being set
  if (domain) {
    cookieOptions.domain = domain
  }
  
  res.cookie('accessToken', accessToken, cookieOptions)

  // Refresh token with longer expiry
  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }
  res.cookie('refreshToken', refreshToken, refreshCookieOptions)
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth] Cookies set:', { secure, sameSite, path: '/', httpOnly: true, domain: domain || 'current domain' })
  }
}

export const clearTokenCookies = (res: Response) => {
  const domain = process.env.SESSION_COOKIE_DOMAIN || undefined
  const clearOptions: {
    path: string
    domain?: string
  } = {
    path: '/',
  }
  
  if (domain) {
    clearOptions.domain = domain
  }
  
  res.clearCookie('accessToken', clearOptions)
  res.clearCookie('refreshToken', clearOptions)
}


