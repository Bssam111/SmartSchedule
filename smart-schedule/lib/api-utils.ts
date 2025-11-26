/**
 * Utility function to get the API base URL
 * In Next.js, NEXT_PUBLIC_* vars are replaced at build time with their actual values
 */
export function getApiBaseUrl(): string {
  // Access NEXT_PUBLIC_API_URL - Next.js replaces this at build time with the actual value
  // Using a safe access pattern that works in both server and client contexts
  let envApiUrl: string | undefined = undefined
  
  try {
    if (globalThis !== undefined && 
      (globalThis as any).process !== undefined &&
      (globalThis as any).process.env !== undefined) {
      envApiUrl = ((globalThis as any).process.env as { NEXT_PUBLIC_API_URL?: string }).NEXT_PUBLIC_API_URL
    }
  } catch (e) {
    // Ignore errors accessing process.env
  }

  // If NEXT_PUBLIC_API_URL is set (replaced at build time), use it
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim() !== '') {
    if (typeof globalThis.window !== 'undefined') {
      console.log('[API] Using NEXT_PUBLIC_API_URL:', envApiUrl)
    }
    return envApiUrl
  }

  // Server-side rendering: use default
  if (globalThis.window === undefined) {
    return 'http://localhost:3001/api'
  }
  
  // Client-side: determine if we're in production
  const isProduction = globalThis.window.location.hostname !== 'localhost' && 
    globalThis.window.location.hostname !== '127.0.0.1'
  
  if (isProduction) {
    // In production without NEXT_PUBLIC_API_URL, use the backend's Railway URL
    // This is a fallback - ideally NEXT_PUBLIC_API_URL should be set in Railway
    const fallbackUrl = 'https://handsome-radiance-production.up.railway.app/api'
    console.warn('[API] NEXT_PUBLIC_API_URL not set, using fallback:', fallbackUrl)
    return fallbackUrl
  }
  
  // Development: use localhost
  return 'http://localhost:3001/api'
}

