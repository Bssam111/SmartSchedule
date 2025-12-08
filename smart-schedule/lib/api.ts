import { getApiBaseUrl, getApiBaseUrlForBrowser } from './api-utils'

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

class ApiClient {
  // Get base URL dynamically to handle both server and client contexts
  // In browser, use localhost (browser can't resolve Docker service names)
  // In server, use service name if in Docker
  private get baseURL(): string {
    // Browser: use the browser-specific function that handles Docker service names and env vars
    if (globalThis.window !== undefined) {
      return getApiBaseUrlForBrowser()
    }
    // Server-side: can use service name if in Docker
    return getApiBaseUrl()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      
      // Build headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      }
      
      // Add Authorization header if token is available (backup to cookies)
      if (typeof globalThis.window !== 'undefined') {
        const token = localStorage.getItem('smartSchedule_token')
        if (token) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        } else {
          // Try to get token from cookies by checking if user is logged in
          const user = localStorage.getItem('smartSchedule_user')
          if (user && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
            console.warn('[API] ⚠️ No token in localStorage but user is logged in. Token may have been cleared. Endpoint:', endpoint)
            console.warn('[API] User data:', JSON.parse(user))
          }
        }
      }
      
      // Always include credentials (cookies) for authenticated requests
      const response = await fetch(url, {
        headers,
        credentials: 'include', // Always send cookies
        ...options,
      })

      // Check for new access token in response header (from backend token refresh)
      // This happens when backend middleware refreshes tokens automatically
      // Check this BEFORE checking response status, as refresh can happen on any response
      const newAccessToken = response.headers.get('X-New-Access-Token')
      if (newAccessToken && globalThis.window !== undefined) {
        console.log('[API] 🔄 New access token received from backend, updating localStorage', {
          endpoint,
          url,
          hasNewToken: true,
        })
        localStorage.setItem('smartSchedule_token', newAccessToken)
      }

      // Handle authentication errors gracefully
      if (response.status === 401) {
        // Check if we have a refresh token and haven't retried yet
        // Note: We can't check for refreshToken in document.cookie because it's HTTP-only
        // But we can try to refresh anyway - the endpoint will return 401 if no valid refresh token cookie exists
        if (retryCount === 0 && typeof globalThis.window !== 'undefined') {
          try {
            // Attempt to refresh the token (refresh token is in HTTP-only cookie, sent automatically)
            const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            })

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              
              // Update stored token if provided
              if (refreshData.token && globalThis.window !== undefined) {
                localStorage.setItem('smartSchedule_token', refreshData.token)
              }

              // Update stored user if provided
              if (refreshData.user && globalThis.window !== undefined) {
                localStorage.setItem('smartSchedule_user', JSON.stringify(refreshData.user))
              }

                // Retry the original request with new token
                const newToken = refreshData.token || localStorage.getItem('smartSchedule_token')
                const newHeaders: HeadersInit = {
                  ...headers,
                }
                if (newToken) {
                  (newHeaders as Record<string, string>)['Authorization'] = `Bearer ${newToken}`
                }

              const retryResponse = await fetch(url, {
                headers: newHeaders,
                credentials: 'include',
                ...options,
              })

              if (retryResponse.ok) {
                const retryData = await retryResponse.json()
                const data = retryData.data !== undefined ? retryData.data : retryData
                return { data, success: retryData.success !== false }
              } else if (retryResponse.status === 401) {
                // Still 401 after refresh - token refresh might have failed
                console.warn('[API] Request still returned 401 after token refresh attempt')
              }
            }
          } catch (refreshError) {
            console.error('[API] Token refresh failed:', refreshError)
          }
        }

        // If refresh failed or no refresh token, clear auth state
        if (globalThis.window !== undefined) {
          localStorage.removeItem('smartSchedule_user')
          localStorage.removeItem('smartSchedule_auth')
          localStorage.removeItem('smartSchedule_token')
        }
        return {
          success: false,
          error: 'Your session has expired. Please log out and log back in to refresh your session.',
        }
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'Access denied. You do not have permission to perform this action.',
        }
      }

      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use default message
        }
        return {
          success: false,
          error: errorMessage,
        }
      }

      const responseData = await response.json()
      // Backend returns { success: true, data: ... } or { success: false, error: ... }
      // For access requests list, we need to preserve both data and meta
      // Check if response has both data and meta (list responses)
      if (responseData.data !== undefined && responseData.meta !== undefined) {
        // Return the full structure for list responses
        return { data: responseData, success: responseData.success !== false }
      }
      // For other responses, extract nested data if present
      const data = responseData.data !== undefined ? responseData.data : responseData
      return { data, success: responseData.success !== false }
    } catch (error) {
      console.error('API request failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if it's a network error
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        const baseUrl = this.baseURL
        console.error('[API] Network error - Base URL:', baseUrl, 'Endpoint:', endpoint)
        return {
          success: false,
          error: `Network error connecting to ${baseUrl}${endpoint}. Please ensure:\n1. The backend container is running (docker-compose up)\n2. Backend is accessible at ${baseUrl.replace('/api', '')}\n3. CORS is properly configured\n4. Check browser console for CORS errors`,
        }
      }
      
      return { 
        error: errorMessage,
        success: false 
      }
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }

  // Authentication
  async login(email: string, password: string, role: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    })
  }

  // Student endpoints
  async getStudentSchedule(studentId: string) {
    return this.request(`/students/${studentId}/schedule`)
  }

  async updateStudentPreferences(studentId: string, preferences: any) {
    return this.request('/preferences', {
      method: 'POST',
      body: JSON.stringify({ userId: studentId, ...preferences }),
    })
  }

  // Faculty endpoints
  async getFacultyAssignments(facultyId: string) {
    return this.request(`/faculty/${facultyId}/assignments`)
  }

  async updateFacultyAvailability(facultyId: string, availability: any) {
    return this.request('/faculty/availability', {
      method: 'POST',
      body: JSON.stringify({ userId: facultyId, availability }),
    })
  }

  // Committee endpoints
  async getDraftSchedules() {
    return this.request('/schedules')
  }

  async generateRecommendations() {
    return this.request('/recommendations', {
      method: 'POST',
    })
  }

  async getFeedback() {
    return this.request('/feedback')
  }

  // Dashboard endpoints
  async getLevelDashboard() {
    return this.request('/dashboard/level')
  }

  async getCourseDashboard() {
    return this.request('/dashboard/course')
  }

  // Schedule generation
  async generateSchedule(seed: number = 1) {
    return this.request('/generate', {
      method: 'POST',
      body: JSON.stringify({ seed }),
    })
  }

  // Access Request endpoints
  async submitAccessRequest(data: {
    fullName: string
    email: string
    desiredRole: 'STUDENT' | 'FACULTY'
    majorId?: string
    reason?: string
  }) {
    return this.request('/access-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // OTP endpoints
  async sendOTP(email: string) {
    return this.request('/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async verifyOTP(email: string, code: string) {
    return this.request('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
  }

  async checkOTPStatus(email: string) {
    return this.request<{ verified: boolean }>(`/otp/status?email=${encodeURIComponent(email)}`)
  }

  // Majors endpoint
  async getMajors() {
    return this.request('/majors')
  }

  // Password change endpoint
  async changePassword(data: {
    currentPassword?: string
    newPassword: string
    confirmPassword: string
  }) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async listAccessRequests(params?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    search?: string
    page?: number
    pageSize?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString())
    
    const query = queryParams.toString()
    return this.request(`/access-requests${query ? `?${query}` : ''}`)
  }

  async lockAccessRequest(requestId: string) {
    return this.request(`/access-requests/${requestId}/lock`, {
      method: 'POST',
    })
  }

  async approveAccessRequest(requestId: string, data?: {
    temporaryPassword?: string
    decisionNote?: string
  }) {
    return this.request(`/access-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  async rejectAccessRequest(requestId: string, data?: {
    decisionNote?: string
  }) {
    return this.request(`/access-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    })
  }
}

  // Create singleton instance - baseURL is computed dynamically via getter
  export const apiClient = new ApiClient()
export default apiClient
