import { getApiBaseUrl } from './api-utils'

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

class ApiClient {
  // Get base URL dynamically to handle both server and client contexts
  private get baseURL(): string {
    return getApiBaseUrl()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data, success: true }
    } catch (error) {
      console.error('API request failed:', error)
      return { 
        error: error instanceof Error ? error.message : 'Unknown error',
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
}

// Create singleton instance - baseURL is computed dynamically via getter
export const apiClient = new ApiClient()
export default apiClient
