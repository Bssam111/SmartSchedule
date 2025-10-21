// Authentication utilities for the frontend
export interface User {
  id: string
  email: string
  name: string
  universityId?: string
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

  // Login with email and password only (role determined by backend)
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔐 AuthService.login called with:', { email, password })
    this.authState.isLoading = true
    this.notifyListeners()

    try {
      // Call the actual backend API
      console.log('🔐 Calling backend API...')
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies for JWT tokens
      })

      const data = await response.json()
      console.log('🔐 Backend response:', data)

      if (!response.ok) {
        // Show the actual error message from the backend
        const errorMessage = data.message || data.error || 'Login failed'
        return { 
          success: false, 
          error: errorMessage 
        }
      }

      if (!data.success || !data.user) {
        // Show the actual error message from the backend
        const errorMessage = data.message || data.error || 'Invalid response from server'
        return { 
          success: false, 
          error: errorMessage 
        }
      }

      // Map backend user to frontend user format
      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        universityId: data.user.universityId,
        role: data.user.role.toLowerCase() as User['role'], // Convert to lowercase
      }

      console.log('🔐 Mapped user:', user)

      this.authState = {
        user,
        isAuthenticated: true,
        isLoading: false,
      }

      console.log('🔐 Updated auth state:', this.authState)

      // Store in localStorage for persistence
      localStorage.setItem('smartSchedule_user', JSON.stringify(user))
      localStorage.setItem('smartSchedule_auth', 'true')

      console.log('🔐 Stored in localStorage')

      this.notifyListeners()
      console.log('🔐 Notified listeners, returning success')
      return { success: true }
    } catch (error) {
      console.error('🔐 AuthService login error:', error)
      this.authState.isLoading = false
      this.notifyListeners()
      
      // Return error without throwing to prevent Next.js error overlay
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      return { 
        success: false, 
        error: errorMessage
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
