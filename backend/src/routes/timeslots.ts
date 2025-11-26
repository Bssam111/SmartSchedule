import { Router } from 'express'
import { authenticateToken, AuthRequest } from '@/middleware/auth'

const router = Router()

// GET /api/timeslots - Get available time slots
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    // Generate time slots based on university schedule
    // 50-minute slots with 10-minute breaks, excluding lunch (11:50-13:00)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    const timeSlots = []

    for (const day of days) {
      let currentTime = '08:00'
      
      while (currentTime < '20:00') {
        const [hours, minutes] = currentTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes
        
        // Calculate end time (50 minutes later)
        const endTotalMinutes = totalMinutes + 50
        const endHours = Math.floor(endTotalMinutes / 60)
        const endMins = endTotalMinutes % 60
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
        
        // Skip lunch period (11:50-13:00)
        if (currentTime >= '11:50' && currentTime < '13:00') {
          currentTime = '13:00'
          continue
        }
        
        // Don't create slots that would end after 20:00
        if (endTime > '20:00') {
          break
        }
        
        timeSlots.push({
          id: `${day}-${currentTime}-${endTime}`,
          dayOfWeek: day,
          startTime: currentTime,
          endTime: endTime,
          label: `${day} ${currentTime}-${endTime}`
        })
        
        // Move to next slot (50 minutes + 10 minute break)
        const nextTotalMinutes = endTotalMinutes + 10
        const nextHours = Math.floor(nextTotalMinutes / 60)
        const nextMins = nextTotalMinutes % 60
        currentTime = `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`
      }
    }

    res.json({
      success: true,
      data: timeSlots
    })
  } catch (error) {
    next(error)
  }
})

export { router as timeslotRoutes }


