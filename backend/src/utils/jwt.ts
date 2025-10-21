import jwt from 'jsonwebtoken'
import { Response } from 'express'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Short-lived access token
      issuer: process.env.JWT_ISSUER || 'smartschedule-api',
      audience: process.env.JWT_AUDIENCE || 'smartschedule-client'
    }
  )

  const refreshToken = jwt.sign(
    { 
      userId: payload.userId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Shorter refresh token
      issuer: process.env.JWT_ISSUER || 'smartschedule-api',
      audience: process.env.JWT_AUDIENCE || 'smartschedule-client'
    }
  )

  return { accessToken, refreshToken }
}

export const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Set access token cookie (short-lived)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  })

  // Set refresh token cookie (longer-lived but still secure)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  })
}

export const clearTokenCookies = (res: Response) => {
  res.clearCookie('accessToken', { path: '/' })
  res.clearCookie('refreshToken', { path: '/' })
}

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
}
