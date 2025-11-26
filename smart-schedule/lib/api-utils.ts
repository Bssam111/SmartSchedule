/**
 * Utility function to get the API base URL
 * Uses relative URL in production (nginx will proxy), absolute URL in development
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  }
  
  // Client-side: use relative URL in production, absolute in development
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  return isProduction 
    ? '/api'  // Relative URL for nginx proxy
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
}

