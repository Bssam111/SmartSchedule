/**
 * Utility function to get the API base URL
 * Uses relative URL in production (nginx will proxy), absolute URL in development
 */
export function getApiBaseUrl(): string {
  // In Next.js, NEXT_PUBLIC_* vars are replaced at build time, so we can reference them directly
  // Using a type-safe access pattern
  const envApiUrl = (globalThis as any).process?.env?.NEXT_PUBLIC_API_URL as string | undefined

  if (typeof globalThis.window === 'undefined') {
    // Server-side: use environment variable or default
    return envApiUrl || 'http://localhost:3001/api'
  }
  
  // Client-side: use relative URL in production, absolute in development
  const isProduction = globalThis.window.location.hostname !== 'localhost' && 
    globalThis.window.location.hostname !== '127.0.0.1'
  return isProduction 
    ? '/api'  // Relative URL for nginx proxy
    : (envApiUrl || 'http://localhost:3001/api')
}

