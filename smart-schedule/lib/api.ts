// API client for connecting to the backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
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
    return this.request('/api/health')
  }

  // Authentication
  async login(email: string, password: string, role: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    })
  }

  // Student endpoints
  async getStudentSchedule(studentId: string) {
    return this.request(`/api/students/${studentId}/schedule`)
  }

  async updateStudentPreferences(studentId: string, preferences: any) {
    return this.request('/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ userId: studentId, ...preferences }),
    })
  }

  // Faculty endpoints
  async getFacultyAssignments(facultyId: string) {
    return this.request(`/api/faculty/${facultyId}/assignments`)
  }

  async updateFacultyAvailability(facultyId: string, availability: any) {
    return this.request('/api/faculty/availability', {
      method: 'POST',
      body: JSON.stringify({ userId: facultyId, availability }),
    })
  }

  // Committee endpoints
  async getDraftSchedules() {
    return this.request('/api/schedules')
  }

  async generateRecommendations() {
    return this.request('/api/recommendations', {
      method: 'POST',
    })
  }

  async getFeedback() {
    return this.request('/api/feedback')
  }

  // Dashboard endpoints
  async getLevelDashboard() {
    return this.request('/api/dashboard/level')
  }

  async getCourseDashboard() {
    return this.request('/api/dashboard/course')
  }

  // Schedule generation
  async generateSchedule(seed: number = 1) {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ seed }),
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
