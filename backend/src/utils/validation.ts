import { z } from 'zod'

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'COMMITTEE'])
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'COMMITTEE']),
  universityId: z.string().optional()
})

// Course validation schemas
export const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  credits: z.number().int().min(1, 'Credits must be at least 1').max(10, 'Credits cannot exceed 10'),
  levelId: z.string().min(1, 'Level ID is required')
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

// Room validation schemas
export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  location: z.string().optional()
})

export const updateRoomSchema = createRoomSchema.partial()

// Schedule validation schemas
export const createScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  status: z.string().optional()
})

export const updateScheduleSchema = createScheduleSchema.partial()

// Assignment validation schemas
export const createAssignmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  sectionId: z.string().min(1, 'Section ID is required')
})

// Preference validation schemas
export const createPreferenceSchema = z.object({
  type: z.string().min(1, 'Preference type is required'),
  value: z.string().min(1, 'Preference value is required')
})

export const updatePreferenceSchema = createPreferenceSchema.partial()

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
