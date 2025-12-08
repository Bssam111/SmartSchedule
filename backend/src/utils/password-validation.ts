import { prisma } from '@/config/database'

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
}

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  requirements: PasswordRequirements
}

/**
 * Get current password requirements from database
 */
export async function getPasswordRequirements(): Promise<PasswordRequirements> {
  let requirements = await prisma.passwordRequirement.findFirst({
    orderBy: { updatedAt: 'desc' }
  })

  // If no requirements exist, return defaults
  if (!requirements) {
    return {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    }
  }

  return {
    minLength: requirements.minLength,
    requireUppercase: requirements.requireUppercase,
    requireLowercase: requirements.requireLowercase,
    requireNumbers: requirements.requireNumbers,
    requireSpecialChars: requirements.requireSpecialChars
  }
}

/**
 * Validate password against current requirements
 */
export async function validatePassword(password: string): Promise<PasswordValidationResult> {
  const requirements = await getPasswordRequirements()
  const errors: string[] = []

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`)
  }

  // Check uppercase
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter')
  }

  // Check lowercase
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter')
  }

  // Check numbers
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must include at least one number')
  }

  // Check special characters
  if (requirements.requireSpecialChars && !/[!@#$%&*]/.test(password)) {
    errors.push('Password must include at least one special character (!@#$%&*)')
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements
  }
}

/**
 * Generate human-readable password requirements description
 */
export function getPasswordRequirementsDescription(requirements: PasswordRequirements): string {
  const parts: string[] = []

  parts.push(`at least ${requirements.minLength} characters`)

  if (requirements.requireUppercase) {
    parts.push('uppercase letter')
  }

  if (requirements.requireLowercase) {
    parts.push('lowercase letter')
  }

  if (requirements.requireNumbers) {
    parts.push('number')
  }

  if (requirements.requireSpecialChars) {
    parts.push('special character (!@#$%&*)')
  }

  if (parts.length === 1) {
    return `Password must be ${parts[0]}`
  }

  const lastPart = parts.pop()
  return `Password must be ${parts.join(', ')}, and ${lastPart}`
}

