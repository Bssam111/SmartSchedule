'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'
import { AppHeader } from '../../../components/AppHeader'
import { DashboardCharts } from '../../../components/DashboardCharts'

const summaryCards = [
  {
    title: 'Active Schedules',
    icon: (
      <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M3 12h18M3 17h18M5 5v14" />
      </svg>
    ),
    description: 'Draft schedules currently under review.'
  },
  {
    title: 'Total Courses',
    icon: (
      <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 16v-2m8-6h2M4 12H2m15.071 4.243l1.414 1.414M5.515 5.515l1.414 1.414m12.142 0l-1.414 1.414M6.929 17.657l-1.414 1.414" />
      </svg>
    ),
    description: 'Courses mapped across each draft.'
  },
  {
    title: 'Total Sections',
    icon: (
      <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    description: 'Instructors and rooms already assigned.'
  },
  {
    title: 'Pending Feedback',
    icon: (
      <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Items requiring committee review.'
  }
]

const quickActions = [
  {
    href: '/committee/schedules',
    title: 'Draft Schedules',
    copy: 'Create sections, assign rooms, and monitor conflicts in real time.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    )
  },
  {
    href: '/committee/recommendations',
    title: 'Recommendations',
    copy: 'Generate balanced options with AI-assisted scheduling.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.591.977c.87-.5 1.924.352 1.56 1.274a1.724 1.724 0 00.637 2.046c.79.552.4 1.808-.588 1.808a1.724 1.724 0 00-1.698 1.234c-.3.921-1.603.921-1.902 0a1.724 1.724 0 00-2.591-.978c-.87.5-1.924-.351-1.56-1.273a1.724 1.724 0 00-.637-2.046c-.79-.552-.4-1.808.588-1.808.83 0 1.566-.53 1.698-1.234z" />
      </svg>
    )
  },
  {
    href: '/committee/feedback',
    title: 'Feedback',
    copy: 'Respond to faculty & student input before publishing.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12V4" />
      </svg>
    )
  },
  {
    href: '/committee/faculty-assignment',
    title: 'Faculty Assignment',
    copy: 'Assign faculty members to courses and sections.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    href: '/analytics',
    title: 'Analytics',
    copy: 'Monitor capacity, instructor loads, and risk signals.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3h2M5 21h14M5 21l2-10h4l2 6h6" />
      </svg>
    )
  }
]

export default function CommitteeDashboard() {
  const { getCurrentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [schedules] = useState([
    { id: '1', name: 'Fall 2024 Draft', status: 'Draft', courses: 15, sections: 25, lastModified: '2 hours ago' },
    { id: '2', name: 'Spring 2024 Final', status: 'Final', courses: 12, sections: 20, lastModified: '1 week ago' }
  ])
  const [feedback] = useState([
    { id: 1, from: 'Student', message: 'CS301 time conflict with MATH201', status: 'Pending', time: '1 hour ago' },
    { id: 2, from: 'Faculty', message: 'Room capacity insufficient for CS101', status: 'Resolved', time: '2 days ago' }
  ])
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [currentSemester, setCurrentSemester] = useState<{ name: string; academicYear: string; semesterNumber: number } | null>(null)
  const [chartData, setChartData] = useState({
    courses: [
      { label: 'Computer Science', value: 18 },
      { label: 'Software Engineering', value: 12 },
      { label: 'Information Systems', value: 9 }
    ],
    sections: [
      { label: 'Week 1', value: 5 },
      { label: 'Week 2', value: 8 },
      { label: 'Week 3', value: 12 },
      { label: 'Week 4', value: 18 }
    ],
    enrollments: [
      { label: 'Freshmen', value: 120 },
      { label: 'Sophomores', value: 98 },
      { label: 'Juniors', value: 86 },
      { label: 'Seniors', value: 74 }
    ],
    schedules: [
      { label: 'Draft', value: 4 },
      { label: 'In Review', value: 2 },
      { label: 'Published', value: 3 }
    ]
  })

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/analytics/dashboard`, {
          credentials: 'include'
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setChartData(result.data.charts || chartData)
          }
        }
      } catch (error) {
        console.warn('Analytics endpoint unavailable — showing demo charts.')
      } finally {
        setLoadingCharts(false)
      }
    }

    const loadCurrentSemester = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        const response = await fetch(`${API_BASE_URL}/semesters/current`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            const currentSem = data.data
            setCurrentSemester({
              name: `${currentSem.academicYear} - Semester ${currentSem.semesterNumber}`,
              academicYear: currentSem.academicYear,
              semesterNumber: currentSem.semesterNumber
            })
          } else {
            setCurrentSemester(null)
          }
        } else {
          setCurrentSemester(null)
        }
      } catch (error) {
        console.error('Error loading current semester:', error instanceof Error ? error.message : 'Unknown error')
        setCurrentSemester(null)
      }
    }

    loadChartData()
    loadCurrentSemester()
  }, [])

  const summaryValues = useMemo(() => {
    const totalSchedules = schedules.length
    const totalCourses = schedules.reduce((sum, schedule) => sum + schedule.courses, 0)
    const totalSections = schedules.reduce((sum, schedule) => sum + schedule.sections, 0)
    const pendingFeedback = feedback.filter(item => item.status === 'Pending').length

    return [totalSchedules, totalCourses, totalSections, pendingFeedback]
  }, [schedules, feedback])

  return (
    <ProtectedRoute requiredRole="committee">
      <div className="min-h-screen bg-slate-50">
        <AppHeader title="Committee Command Center" showBack={false} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-slate-900">Welcome back, {getCurrentUser()?.name || 'Committee Member'}</h2>
            <p className="text-slate-500 mt-2">
              Monitor draft schedules, respond to feedback, and keep every department aligned from one central workspace.
            </p>
            {currentSemester && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 inline-block">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-700">Current Semester:</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                    {currentSemester.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
            <aside className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
              <nav className="space-y-3">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Navigation</div>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'overview'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
                  </svg>
                  Overview
                </button>
                {quickActions.map(action => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <div className="mt-0.5 text-slate-400">{action.icon}</div>
                    <div>
                      <p className="font-medium text-slate-900">{action.title}</p>
                      <p className="text-xs text-slate-500">{action.copy}</p>
                    </div>
                  </Link>
                ))}
              </nav>
            </aside>

            <main className="space-y-8">
              {activeTab === 'overview' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {summaryCards.map((card, index) => (
                      <div key={card.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="bg-slate-100 rounded-xl p-3">{card.icon}</div>
                          <span className="text-3xl font-semibold text-slate-900">{summaryValues[index]}</span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{card.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Operational Analytics</h3>
                        <p className="text-sm text-slate-500">Live distribution of courses, sections, and enrollments</p>
                      </div>
                      {!loadingCharts && (
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                          Auto-refreshed
                        </span>
                      )}
                    </div>
                    {loadingCharts ? (
                      <div className="h-64 flex items-center justify-center text-slate-400">
                        Loading charts...
                      </div>
                    ) : (
                      <DashboardCharts data={chartData} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Recent Schedules</h3>
                          <p className="text-sm text-slate-500">Latest drafts and published versions</p>
                        </div>
                        <Link href="/committee/schedules" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                          View all
                        </Link>
                      </div>
                      <div className="space-y-4">
                        {schedules.map(schedule => (
                          <div key={schedule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <h4 className="font-semibold text-slate-900">{schedule.name}</h4>
                              <p className="text-xs text-slate-500">
                                {schedule.courses} courses • {schedule.sections} sections
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  schedule.status === 'Draft'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {schedule.status}
                              </span>
                              <p className="text-xs text-slate-400 mt-2">Updated {schedule.lastModified}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Feedback Inbox</h3>
                          <p className="text-sm text-slate-500">Track and respond to priority items</p>
                        </div>
                        <Link href="/committee/feedback" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                          Manage
                        </Link>
                      </div>
                      <div className="space-y-4">
                        {feedback.map(item => (
                          <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-900">{item.from}</p>
                              <span
                                className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                  item.status === 'Pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">{item.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
