// Mock data for development without database
export const mockData = {
  users: [
    {
      id: 'user-1',
      email: 'student@university.edu',
      name: 'John Student',
      role: 'STUDENT' as const
    },
    {
      id: 'user-2', 
      email: 'faculty@university.edu',
      name: 'Dr. Smith',
      role: 'FACULTY' as const
    },
    {
      id: 'user-3',
      email: 'committee@university.edu', 
      name: 'Scheduling Committee',
      role: 'COMMITTEE' as const
    }
  ],
  courses: [
    {
      id: 'course-1',
      code: 'CS101',
      name: 'Introduction to Computer Science',
      credits: 3,
      level: 'Freshman'
    },
    {
      id: 'course-2',
      code: 'CS201', 
      name: 'Data Structures',
      credits: 3,
      level: 'Sophomore'
    },
    {
      id: 'course-3',
      code: 'CS301',
      name: 'Algorithms',
      credits: 3,
      level: 'Junior'
    }
  ],
  schedules: [
    {
      id: 'schedule-1',
      name: 'Fall 2024 Schedule',
      status: 'DRAFT' as const,
      version: 1,
      createdAt: new Date().toISOString()
    }
  ],
  assignments: [
    {
      id: 'assign-1',
      studentId: 'user-1',
      courseId: 'course-1',
      sectionId: 'section-1',
      scheduleId: 'schedule-1'
    },
    {
      id: 'assign-2', 
      studentId: 'user-1',
      courseId: 'course-2',
      sectionId: 'section-2',
      scheduleId: 'schedule-1'
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      userId: 'user-1',
      title: 'New Schedule Available',
      message: 'Your fall 2024 schedule has been generated',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-2',
      userId: 'user-1', 
      title: 'Elective Preferences Updated',
      message: 'Your elective preferences have been saved',
      isRead: true,
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ]
}

export type User = typeof mockData.users[0]
export type Course = typeof mockData.courses[0]
export type Schedule = typeof mockData.schedules[0]
export type Assignment = typeof mockData.assignments[0]
export type Notification = typeof mockData.notifications[0]
