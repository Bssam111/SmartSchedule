// Authentication utilities for the frontend
export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'faculty' | 'committee'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Mock authentication for demo purposes
export class AuthService {
  private static instance: AuthService
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }

  private listeners: ((state: AuthState) => void)[] = []

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState))
  }

  // Login with email, password, and role
  async login(email: string, password: string, role: string): Promise<{ success: boolean; error?: string }> {
    this.authState.isLoading = true
    this.notifyListeners()

    try {
      // Mock authentication - in production, this would call your API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      // For demo purposes, accept any credentials
      const user: User = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: role as User['role'],
      }

      this.authState = {
        user,
        isAuthenticated: true,
        isLoading: false,
      }

      // Store in localStorage for persistence
      localStorage.setItem('smartSchedule_user', JSON.stringify(user))
      localStorage.setItem('smartSchedule_auth', 'true')

      this.notifyListeners()
      return { success: true }
    } catch (error) {
      this.authState.isLoading = false
      this.notifyListeners()
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    }
  }

  // Logout
  logout() {
    this.authState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }

    localStorage.removeItem('smartSchedule_user')
    localStorage.removeItem('smartSchedule_auth')
    this.notifyListeners()
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authState.user
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.authState }
  }

  // Initialize auth state from localStorage
  initialize() {
    try {
      const storedUser = localStorage.getItem('smartSchedule_user')
      const isAuth = localStorage.getItem('smartSchedule_auth') === 'true'

      if (storedUser && isAuth) {
        const user = JSON.parse(storedUser)
        this.authState = {
          user,
          isAuthenticated: true,
          isLoading: false,
        }
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Error initializing auth state:', error)
      this.logout()
    }
  }

  // Check if user has specific role
  hasRole(role: User['role']): boolean {
    return this.authState.user?.role === role
  }

  // Check if user is student
  isStudent(): boolean {
    return this.hasRole('student')
  }

  // Check if user is faculty
  isFaculty(): boolean {
    return this.hasRole('faculty')
  }

  // Check if user is committee
  isCommittee(): boolean {
    return this.hasRole('committee')
  }
}

// Export singleton instance
export const authService = AuthService.getInstance()
