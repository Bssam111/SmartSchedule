'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '../../../components/ProtectedRoute'
import { useAuth } from '../../../components/AuthProvider'
import { AppHeader } from '../../../components/AppHeader'

const summaryCards = [
  {
    title: 'Total Users',
    icon: (
      <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    description: 'All system users across all roles.'
  },
  {
    title: 'Pending Requests',
    icon: (
      <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'Access requests awaiting review.'
  },
  {
    title: 'Active Courses',
    icon: (
      <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    description: 'Courses in the system.'
  },
  {
    title: 'System Health',
    icon: (
      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'System status and performance.'
  }
]

const quickActions = [
  {
    href: '/admin/users',
    title: 'Manage Users',
    copy: 'Add, edit, remove users and manage roles across the system.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    href: '/admin/access-requests',
    title: 'Access Requests',
    copy: 'Review and approve access requests from students.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    href: '/admin/courses',
    title: 'Manage Courses',
    copy: 'Add, edit, and remove courses from the system.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    href: '/admin/semesters',
    title: 'Semester Management',
    copy: 'Set current semester and manage registration windows.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    href: '/admin/settings',
    title: 'System Settings',
    copy: 'Configure global settings, password policies, and system preferences.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
]

export default function AdminDashboard() {
  const { getCurrentUser, authState } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    activeCourses: 0,
    systemHealth: 'Operational'
  })

  useEffect(() => {
    const loadStats = async () => {
      // Wait for auth to finish loading
      if (authState.isLoading) {
        return
      }

      // Only load stats if user is authenticated and is an admin
      const user = getCurrentUser()
      if (!user || user.role?.toUpperCase() !== 'ADMIN') {
        return // Don't make API calls if user is not admin
      }

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
        
        // Load user count
        const usersResponse = await fetch(`${API_BASE_URL}/users`, {
          credentials: 'include'
        })
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          if (usersData.success && usersData.data) {
            setStats(prev => ({ ...prev, totalUsers: usersData.data.length }))
          }
        }

        // Load pending access requests (only for admins)
        const requestsResponse = await fetch(`${API_BASE_URL}/access-requests?status=PENDING`, {
          credentials: 'include'
        })
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          if (requestsData.success && requestsData.meta) {
            setStats(prev => ({ ...prev, pendingRequests: requestsData.meta.counts.pending }))
          }
        } else if (requestsResponse.status === 403) {
          // Silently ignore 403 errors (unauthorized) - user shouldn't be here anyway
          console.warn('Access denied to access-requests endpoint')
        }
      } catch (error) {
        console.warn('Failed to load admin stats:', error)
      }
    }

    loadStats()
  }, [getCurrentUser, authState.isLoading])

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-slate-50">
        <AppHeader title="Admin Dashboard" showBack={false} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-slate-900">Welcome back, {getCurrentUser()?.name || 'Administrator'}</h2>
            <p className="text-slate-500 mt-2">
              Manage users, courses, access requests, and system settings from one central control panel.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
            <aside className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
              <nav className="space-y-3">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Navigation</div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {summaryCards.map((card, index) => (
                  <div key={card.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="bg-slate-100 rounded-xl p-3">{card.icon}</div>
                      <span className="text-3xl font-semibold text-slate-900">
                        {index === 0 && stats.totalUsers}
                        {index === 1 && stats.pendingRequests}
                        {index === 2 && stats.activeCourses}
                        {index === 3 && '✓'}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{card.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map(action => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-slate-400">{action.icon}</div>
                        <h4 className="font-semibold text-slate-900">{action.title}</h4>
                      </div>
                      <p className="text-sm text-slate-600">{action.copy}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

