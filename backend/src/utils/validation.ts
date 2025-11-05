import { z } from 'zod'
import { validatePasswordStrength, validateAndNormalizeEmail } from '@/middleware/security'

// Enhanced user validation schemas with security measures
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password too long')
})

export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .transform((email) => {
      const { isValid, normalized, errors } = validateAndNormalizeEmail(email)
      if (!isValid) {
        throw new z.ZodError([{ code: 'custom', message: errors.join(', '), path: ['email'] }])
      }
      return normalized
    }),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .refine((password) => {
      const { isValid, errors } = validatePasswordStrength(password)
      if (!isValid) {
        throw new z.ZodError([{ code: 'custom', message: errors.join(', '), path: ['password'] }])
      }
      return true
    }),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'COMMITTEE']),
  universityId: z.string()
    .min(1, 'University ID is required')
    .max(50, 'University ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'University ID contains invalid characters')
    .optional()
})

// Enhanced course validation schemas
export const createCourseSchema = z.object({
  code: z.string()
    .min(1, 'Course code is required')
    .max(20, 'Course code too long')
    .regex(/^[A-Z\d\-_]+$/, 'Course code contains invalid characters'),
  name: z.string()
    .min(1, 'Course name is required')
    .max(200, 'Course name too long')
    .regex(/^[a-zA-Z\d\s\-_.,()]+$/, 'Course name contains invalid characters'),
  credits: z.number()
    .int('Credits must be an integer')
    .min(1, 'Credits must be at least 1')
    .max(10, 'Credits cannot exceed 10'),
  levelId: z.string()
    .min(1, 'Level ID is required')
    .max(50, 'Level ID too long')
    .regex(/^[a-zA-Z\d\-_]+$/, 'Level ID contains invalid characters')
})

export const updateCourseSchema = createCourseSchema.partial()

// Section validation schemas
export const timeSlotSchema = z.object({
  dayOfWeek: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
}).refine((data) => {
  // Validate 50-minute duration
  const startMinutes = timeToMinutes(data.startTime)
  const endMinutes = timeToMinutes(data.endTime)
  return endMinutes - startMinutes === 50
}, {
  message: 'Time slots must be exactly 50 minutes long'
}).refine((data) => {
  // Block lunch period (11:50-13:00)
  return !((data.startTime >= '11:50' && data.startTime < '13:00') || 
           (data.endTime > '11:50' && data.endTime <= '13:00') ||
           (data.startTime < '11:50' && data.endTime > '13:00'))
}, {
  message: 'Time slots cannot overlap with lunch period (11:50-13:00)'
})

export const createSectionSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  instructorId: z.string().min(1, 'Instructor ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(200, 'Capacity cannot exceed 200'),
  meetings: z.array(timeSlotSchema).min(1, 'At least one meeting is required')
})

export const updateSectionSchema = createSectionSchema.partial()

// Enhanced room validation schemas
export const createRoomSchema = z.object({
  name: z.string()
    .min(1, 'Room name is required')
    .max(100, 'Room name too long')
    .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'Room name contains invalid characters'),
  capacity: z.number()
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500'),
  location: z.string()
    .max(200, 'Location too long')
    .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'Location contains invalid characters')
    .optional()
})

export const updateRoomSchema = createRoomSchema.partial()

// Enhanced schedule validation schemas
export const createScheduleSchema = z.object({
  name: z.string()
    .min(1, 'Schedule name is required')
    .max(200, 'Schedule name too long')
    .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'Schedule name contains invalid characters'),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional()
})

export const updateScheduleSchema = createScheduleSchema.partial()

// Enhanced assignment validation schemas
export const createAssignmentSchema = z.object({
  studentId: z.string()
    .min(1, 'Student ID is required')
    .max(50, 'Student ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Student ID contains invalid characters'),
  sectionId: z.string()
    .min(1, 'Section ID is required')
    .max(50, 'Section ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Section ID contains invalid characters')
})

// Enhanced preference validation schemas
export const createPreferenceSchema = z.object({
  type: z.string()
    .min(1, 'Preference type is required')
    .max(50, 'Preference type too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Preference type contains invalid characters'),
  value: z.string()
    .min(1, 'Preference value is required')
    .max(1000, 'Preference value too long')
})

export const updatePreferenceSchema = createPreferenceSchema.partial()

// Enhanced feedback validation schemas
export const createFeedbackSchema = z.object({
  content: z.string()
    .min(10, 'Feedback must be at least 10 characters')
    .max(2000, 'Feedback too long')
    .regex(/^[a-zA-Z\d\s\-_.,()!?@#$%^&*]+$/, 'Feedback contains invalid characters'),
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5')
    .optional(),
  scheduleId: z.string()
    .min(1, 'Schedule ID is required')
    .max(50, 'Schedule ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Schedule ID contains invalid characters')
    .optional()
})

export const updateFeedbackSchema = createFeedbackSchema.partial()

// Enhanced notification validation schemas
export const createNotificationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .regex(/^[a-zA-Z0-9\s\-_.,()!?]+$/, 'Title contains invalid characters'),
  message: z.string()
    .min(1, 'Message is required')
    .max(1000, 'Message too long')
    .regex(/^[a-zA-Z\d\s\-_.,()!?@#$%^&*]+$/, 'Message contains invalid characters'),
  userId: z.string()
    .min(1, 'User ID is required')
    .max(50, 'User ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'User ID contains invalid characters')
})

export const updateNotificationSchema = createNotificationSchema.partial()

// Security-focused validation schemas
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .refine((password) => {
      const { isValid, errors } = validatePasswordStrength(password)
      if (!isValid) {
        throw new z.ZodError([{ code: 'custom', message: errors.join(', '), path: ['newPassword'] }])
      }
      return true
    }),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const emailChangeSchema = z.object({
  newEmail: z.string()
    .email('Invalid email address')
    .transform((email) => {
      const { isValid, normalized, errors } = validateAndNormalizeEmail(email)
      if (!isValid) {
        throw new z.ZodError([{ code: 'custom', message: errors.join(', '), path: ['newEmail'] }])
      }
      return normalized
    }),
  password: z.string().min(1, 'Password is required for email change')
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').max(1000, 'Page too large').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().max(50, 'Sort field too long').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// Search validation
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query too long')
    .regex(/^[a-zA-Z\d\s\-_.,()]+$/, 'Search query contains invalid characters'),
  filters: z.record(z.string(), z.any()).optional()
})


// Helper function to convert time string to minutes
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// Generate valid time slots for a day
export function generateTimeSlots(): Array<{dayOfWeek: string, startTime: string, endTime: string}> {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  const timeSlots = []
  
  for (const day of days) {
    let currentTime = '08:00'
    
    while (currentTime < '20:00') {
      const startTime = currentTime
      const endTime = addMinutes(currentTime, 50)
      
      // Skip lunch period (11:50-13:00)
      if (startTime >= '11:50' && startTime < '13:00') {
        currentTime = '13:00'
        continue
      }
      
      // Don't create slots that would end after 20:00
      if (endTime > '20:00') {
        break
      }
      
      timeSlots.push({
        dayOfWeek: day,
        startTime,
        endTime
      })
      
      // Move to next slot (50 minutes + 10 minute break)
      currentTime = addMinutes(endTime, 10)
    }
  }
  
  return timeSlots
}

function addMinutes(timeString: string, minutes: number): string {
  const [hours, mins] = timeString.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}
