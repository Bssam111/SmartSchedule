/**
 * Utility function to get the API base URL
 * Always uses the correct Railway backend URL in production
 */
export function getApiBaseUrl(): string {
  // CORRECT Railway backend URL - use this always in production
  const CORRECT_BACKEND_URL = 'https://handsome-radiance-production.up.railway.app/api'
  
  // Server-side rendering: use default
  if (globalThis.window === undefined) {
    return 'http://localhost:3001/api'
  }
  
  // Client-side: determine if we're in production
  const isProduction = globalThis.window.location.hostname !== 'localhost' && 
    globalThis.window.location.hostname !== '127.0.0.1'
  
  if (isProduction) {
    // ALWAYS use the correct Railway backend URL in production
    // This overrides any potentially corrupted NEXT_PUBLIC_API_URL
    console.log('[API] Using Railway backend URL:', CORRECT_BACKEND_URL)
    return CORRECT_BACKEND_URL
  }
  
  // Development: use localhost
  return 'http://localhost:3001/api'
}

