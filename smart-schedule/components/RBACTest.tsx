'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'

const RBACTest = () => {
  const { authState } = useAuth()
  const user = authState.user
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const permissionTests = [
    {
      name: 'User Read (Any)',
      endpoint: '/api/rbac-test/users',
      method: 'GET',
      description: 'Read all users - COMMITTEE only',
      expectedRole: ['committee']
    },
    {
      name: 'User Create',
      endpoint: '/api/rbac-test/users',
      method: 'POST',
      description: 'Create new user - COMMITTEE only',
      expectedRole: ['committee']
    },
    {
      name: 'User Update',
      endpoint: '/api/rbac-test/users/123',
      method: 'PUT',
      description: 'Update user - COMMITTEE only',
      expectedRole: ['committee']
    },
    {
      name: 'User Delete',
      endpoint: '/api/rbac-test/users/123',
      method: 'DELETE',
      description: 'Delete user - COMMITTEE only',
      expectedRole: ['committee']
    },
    {
      name: 'Course Create',
      endpoint: '/api/rbac-test/courses',
      method: 'POST',
      description: 'Create course - COMMITTEE only',
      expectedRole: ['committee']
    },
    {
      name: 'Schedule Publish',
      endpoint: '/api/rbac-test/schedules/123/publish',
      method: 'PATCH',
      description: 'Publish schedule - COMMITTEE only',
      expectedRole: ['committee']
    },
    {
      name: 'System Logs',
      endpoint: '/api/rbac-test/system/logs',
      method: 'GET',
      description: 'View system logs - COMMITTEE only',
      expectedRole: ['committee']
    },
    {
      name: 'System Backup',
      endpoint: '/api/rbac-test/system/backup',
      method: 'POST',
      description: 'Create system backup - COMMITTEE only',
      expectedRole: ['committee']
    }
  ]

  const testPermission = async (test: any) => {
    try {
      const response = await fetch(`http://localhost:3001${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-token-${user?.role}` // Mock token for demo
        },
        body: test.method !== 'GET' ? JSON.stringify({}) : undefined
      })

      const data = await response.json()
      
      return {
        success: response.ok,
        status: response.status,
        data: data,
        hasPermission: response.ok
      }
    } catch (error) {
      return {
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        hasPermission: false
      }
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    const results: Record<string, any> = {}

    for (const test of permissionTests) {
      const result = await testPermission(test)
      results[test.name] = result
    }

    setTestResults(results)
    setLoading(false)
  }

  const getPermissionStatus = (test: any) => {
    const result = testResults[test.name]
    if (!result) return 'pending'
    
    if (result.hasPermission) {
      return test.expectedRole.includes(user?.role || '') ? 'correct' : 'incorrect'
    } else {
      return test.expectedRole.includes(user?.role || '') ? 'incorrect' : 'correct'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'text-green-600 bg-green-100'
      case 'incorrect': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'correct': return '✅ Correct'
      case 'incorrect': return '❌ Incorrect'
      case 'pending': return '⏳ Pending'
      default: return '❓ Unknown'
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">RBAC Test</h2>
          <p className="text-yellow-700">Please log in to test RBAC permissions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">RBAC Permission Testing</h1>
          <p className="text-gray-600 mb-4">
            Test the Role-Based Access Control system with different user roles.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Current User</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {user.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {user.email}
              </div>
              <div>
                <span className="font-medium">Role:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'committee' ? 'bg-purple-100 text-purple-800' :
                  user.role === 'faculty' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user.role.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="font-medium">University ID:</span> {user.universityId || 'N/A'}
              </div>
            </div>
          </div>

          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Run All Permission Tests'}
          </button>
        </div>

        <div className="space-y-4">
          {permissionTests.map((test, index) => {
            const status = getPermissionStatus(test)
            const result = testResults[test.name]
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{test.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Expected Role:</span> {test.expectedRole.join(', ')}
                </div>
                
                {result && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Status:</span> {result.status}
                      </div>
                      <div>
                        <span className="font-medium">Success:</span> {result.success ? 'Yes' : 'No'}
                      </div>
                    </div>
                    {result.data && (
                      <div className="mt-2">
                        <span className="font-medium">Response:</span>
                        <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-2 text-red-600">
                        <span className="font-medium">Error:</span> {result.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Test Instructions</h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Login with different user roles (student@demo.com, faculty@demo.com, committee@demo.com)</li>
            <li>Run the permission tests for each role</li>
            <li>Verify that permissions match the expected role-based access</li>
            <li>Students and Faculty should be denied access to admin functions</li>
            <li>Committee members should have access to all functions</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default RBACTest