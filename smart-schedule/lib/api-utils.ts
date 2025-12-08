const LOCAL_FALLBACK = 'http://localhost:3001/api'

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

  // SSR path: fall back immediately so Next.js can build URLs even without window
  if (globalThis.window === undefined) {
    return LOCAL_FALLBACK
  }

  return LOCAL_FALLBACK
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
    
    return LOCAL_FALLBACK
  }
  
  // Server-side: use service name if in Docker, localhost otherwise
  return getApiBaseUrl()
}


