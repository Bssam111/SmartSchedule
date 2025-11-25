import { Router } from 'express'
import { prisma } from '@/config/database'
import { authenticateToken, AuthRequest } from '@/middleware/auth'
import { CustomError } from '@/middleware/errorHandler'

const router = Router()

// GET /api/analytics/dashboard - Get dashboard statistics
router.get('/dashboard', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!

    // Get basic counts
    const [coursesCount, sectionsCount, studentsCount, facultyCount, schedulesCount] = await Promise.all([
      prisma.course.count(),
      prisma.section.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'FACULTY' } }),
      prisma.schedule.count(),
    ])

    // Get courses by level
    const coursesByLevel = await prisma.course.groupBy({
      by: ['levelId'],
      _count: true,
    })

    const levels = await prisma.level.findMany({
      where: { id: { in: coursesByLevel.map(c => c.levelId) } },
    })

    const coursesChart = coursesByLevel.map(item => {
      const level = levels.find(l => l.id === item.levelId)
      return {
        label: level?.name || 'Unknown',
        value: item._count,
      }
    })

    // Get sections created over time (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const sectionsByDate = await prisma.section.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: true,
    })

    const sectionsChart = sectionsByDate.map(item => ({
      label: new Date(item.createdAt).toLocaleDateString(),
      value: item._count,
    }))

    // Get enrollment distribution
    const enrollmentsByCourse = await prisma.assignment.groupBy({
      by: ['courseId'],
      _count: true,
    })

    const courses = await prisma.course.findMany({
      where: { id: { in: enrollmentsByCourse.map(e => e.courseId) } },
    })

    const enrollmentChart = enrollmentsByCourse.map(item => {
      const course = courses.find(c => c.id === item.courseId)
      return {
        label: course?.code || 'Unknown',
        value: item._count,
      }
    })

    // Get schedules by status
    const schedulesByStatus = await prisma.schedule.groupBy({
      by: ['status'],
      _count: true,
    })

    const schedulesChart = schedulesByStatus.map(item => ({
      label: item.status,
      value: item._count,
    }))

    res.json({
      success: true,
      data: {
        summary: {
          courses: coursesCount,
          sections: sectionsCount,
          students: studentsCount,
          faculty: facultyCount,
          schedules: schedulesCount,
        },
        charts: {
          courses: coursesChart,
          sections: sectionsChart,
          enrollments: enrollmentChart,
          schedules: schedulesChart,
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

export { router as analyticsRoutes }

