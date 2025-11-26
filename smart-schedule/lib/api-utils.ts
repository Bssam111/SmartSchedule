/**
 * Utility function to get the API base URL
 * Always uses the correct Railway backend URL in production
 * Uses hardcoded URL to avoid any environment variable corruption
 */
export function getApiBaseUrl(): string {
  // CORRECT Railway backend URL - hardcoded to prevent corruption
  // Split into parts to avoid any potential string corruption
  const PROTOCOL = 'https'
  const DOMAIN = 'handsome-radiance-production'
  const TLD = 'up.railway.app'
  const PATH = '/api'
  
  const CORRECT_BACKEND_URL = `${PROTOCOL}://${DOMAIN}.${TLD}${PATH}`
  
  // Server-side rendering: use default
  if (globalThis.window === undefined) {
    return 'http://localhost:3001/api'
  }
  
  // Client-side: determine if we're in production
  const isProduction = globalThis.window.location.hostname !== 'localhost' && 
    globalThis.window.location.hostname !== '127.0.0.1'
  
  if (isProduction) {
    // ALWAYS use the correct Railway backend URL in production
    // Verify the URL is correct before returning
    if (!CORRECT_BACKEND_URL.includes('handsome-radiance-production.up.railway.app')) {
      console.error('[API] URL CORRUPTION DETECTED!', CORRECT_BACKEND_URL)
      // Force correct URL even if corrupted
      return 'https://handsome-radiance-production.up.railway.app/api'
    }
    console.log('[API] Using Railway backend URL:', CORRECT_BACKEND_URL)
    return CORRECT_BACKEND_URL
  }
  
  // Development: use localhost
  return 'http://localhost:3001/api'
}

