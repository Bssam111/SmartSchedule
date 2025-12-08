// Determine fallback based on environment
// In production/deployment, don't default to localhost
const getLocalFallback = (): string => {
  // If we're in a browser and have no env vars, check if we're in development
  if (typeof window !== 'undefined') {
    // In browser, check if we're on localhost (development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api'
    }
    // In production, log warning but return empty to force env var usage
    console.error('⚠️ NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL must be set in production')
    return ''
  }
  // Server-side: default to localhost only in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001/api'
  }
  // Production: log warning
  console.error('⚠️ NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL must be set in production')
  return ''
}

function sanitizeUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) {
    return null
  }

  try {
    const url = new URL(rawUrl)
    // Trim trailing slash so downstream callers build endpoints predictably
    return url.toString().replace(/\/$/, '')
  } catch (error) {
    console.warn('[API] Invalid API URL, falling back to default:', error)
    return null
  }
}

/**
 * Returns the API base URL. 
 * Checks NEXT_PUBLIC_API_BASE_URL first, then NEXT_PUBLIC_API_URL (legacy), then falls back to localhost.
 */
export function getApiBaseUrl(): string {
  // Try NEXT_PUBLIC_API_BASE_URL first (new standard)
  const baseUrl = sanitizeUrl(process.env['NEXT_PUBLIC_API_BASE_URL'])
  if (baseUrl) {
    // If it doesn't end with /api, add it
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
  }

  // Fallback to legacy NEXT_PUBLIC_API_URL
  const legacyUrl = sanitizeUrl(process.env['NEXT_PUBLIC_API_URL'])
  if (legacyUrl) {
    return legacyUrl
  }

  // SSR path: fall back only in development
  if (globalThis.window === undefined) {
    const fallback = getLocalFallback()
    if (fallback) return fallback
    // In production without env var, return empty string - will cause fetch to fail with clear error
    return ''
  }

  const fallback = getLocalFallback()
  if (fallback) return fallback
  // In production without env var, return empty string - will cause fetch to fail with clear error
  return ''
}

/**
 * Get the API base URL for browser requests
 * In Docker, backend-dev service name is used internally
 * In browser, we need to use localhost since browser can't resolve Docker service names
 */
export function getApiBaseUrlForBrowser(): string {
  // In browser, always use localhost (browser can't resolve Docker service names)
  if (typeof window !== 'undefined') {
    // Try NEXT_PUBLIC_API_BASE_URL first (new standard)
    const envUrl = sanitizeUrl(process.env['NEXT_PUBLIC_API_BASE_URL'])
    if (envUrl) {
      // Replace any Docker service names with localhost for browser
      let browserUrl = envUrl
        .replace(/backend-dev:3001/g, 'localhost:3001')
        .replace(/backend:3001/g, 'localhost:3001')
        .replace(/http:\/\/backend-dev\/api/g, 'http://localhost:3001/api')
        .replace(/http:\/\/backend\/api/g, 'http://localhost:3001/api')
      return browserUrl.endsWith('/api') ? browserUrl : `${browserUrl}/api`
    }
    
    // Fallback to legacy NEXT_PUBLIC_API_URL
    const legacyUrl = sanitizeUrl(process.env['NEXT_PUBLIC_API_URL'])
    if (legacyUrl) {
      // Replace any Docker service names with localhost for browser
      const browserUrl = legacyUrl
        .replace(/backend-dev:3001/g, 'localhost:3001')
        .replace(/backend:3001/g, 'localhost:3001')
        .replace(/http:\/\/backend-dev\/api/g, 'http://localhost:3001/api')
        .replace(/http:\/\/backend\/api/g, 'http://localhost:3001/api')
      return browserUrl
    }
    
    const fallback = getLocalFallback()
    if (fallback) return fallback
    // In production without env var, return empty string - will cause fetch to fail with clear error
    return ''
  }
  
  // Server-side: use service name if in Docker, localhost otherwise
  return getApiBaseUrl()
}


