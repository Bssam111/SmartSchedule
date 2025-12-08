'use client'
import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/components/AuthProvider'
import { AppHeader } from '@/components/AppHeader'
import { apiClient } from '@/lib/api'
import { showToast } from '@/components/Toast'

interface AccessRequest {
  id: string
  fullName: string
  email: string
  desiredRole: 'STUDENT'
  major?: {
    id: string
    name: string
  }
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decisionNote?: string
  reviewer?: {
    id: string
    name: string
    email: string
  }
  decisionAt?: string
  createdAt: string
  isLocked?: boolean
  lockExpired?: boolean
}

interface AccessRequestListResponse {
  success: boolean
  data: AccessRequest[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    counts: {
      pending: number
      approved: number
      rejected: number
    }
  }
}

export default function AccessRequestsPage() {
  const { user } = useAuth()
  // Toast notifications are handled via showToast function
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<AccessRequestListResponse['meta'] | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [showDecisionModal, setShowDecisionModal] = useState<'approve' | 'reject' | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.listAccessRequests({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery || undefined,
        page,
        pageSize: 20,
      })

      if (response.success && response.data) {
        // API client now returns the full response object { data: [...], meta: {...} }
        const data = response.data as AccessRequestListResponse
        setRequests(data.data || [])
        setMeta(data.meta || null)
      } else {
        const errorMsg = response.error || 'Failed to load access requests'
        setError(errorMsg)
        
        // If it's an auth error, redirect to login
        if (errorMsg.includes('Authentication required') || errorMsg.includes('401')) {
          // Clear auth state
          localStorage.removeItem('smartSchedule_user')
          localStorage.removeItem('smartSchedule_auth')
          localStorage.removeItem('smartSchedule_token')
          // Redirect will be handled by ProtectedRoute
        }
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchRequests()
    }
  }, [user, statusFilter, searchQuery, page])

  const handleLock = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const response = await apiClient.lockAccessRequest(requestId)
      if (response.success) {
        await fetchRequests()
      } else {
        showToast(response.error || 'Failed to lock request', 'error')
      }
    } catch (err) {
      console.error('Error locking request:', err)
        showToast('An unexpected error occurred', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    // Check if token exists before making request
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('smartSchedule_token')
      if (!token) {
        console.warn('No token found, checking if user needs to log in again')
        const user = localStorage.getItem('smartSchedule_user')
        if (user) {
          showToast('Your session token is missing. Please log out and log back in to refresh your session.', 'error')
          return
        }
      }
    }

    setActionLoading(selectedRequest.id)
    try {
      const response = await apiClient.approveAccessRequest(selectedRequest.id, {
        decisionNote: decisionNote || undefined,
      })

      if (response.success) {
        setShowDecisionModal(null)
        setSelectedRequest(null)
        setDecisionNote('')
        
        // Refresh the list, but don't fail if it errors (approval succeeded)
        try {
          await fetchRequests()
        } catch (refreshError) {
          console.warn('Failed to refresh requests list after approval:', refreshError)
          // Don't show error to user - approval succeeded
        }
        
        // Show success toast notification instead of alert
        showToast('Request approved successfully! An account has been created and an email with login credentials has been sent to the requester.', 'success')
      } else {
        const errorMsg = response.error || 'Failed to approve request'
        // Only treat 401 as session expiration, not 500 (server errors)
        if ((errorMsg.includes('Authentication required') || errorMsg.includes('session expired')) && 
            !errorMsg.includes('Reviewer identity missing')) {
          showToast('Your session has expired. Please log out and log back in to refresh your session.', 'error')
          // Clear auth state
          localStorage.removeItem('smartSchedule_user')
          localStorage.removeItem('smartSchedule_auth')
          localStorage.removeItem('smartSchedule_token')
          globalThis.window.location.href = '/login'
        } else {
          showToast(errorMsg, 'error')
        }
      }
    } catch (err) {
      console.error('Error approving request:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      // Only treat authentication/401 errors as session expiration
      // Network errors and server errors (500) should show different messages
      if ((errorMessage.includes('Authentication') || errorMessage.includes('session expired')) && 
          !errorMessage.includes('Reviewer identity missing')) {
        showToast('Your session has expired or there was a connection error. Please log out and log back in.', 'error')
        localStorage.removeItem('smartSchedule_user')
        localStorage.removeItem('smartSchedule_auth')
        localStorage.removeItem('smartSchedule_token')
        globalThis.window.location.href = '/login'
      } else if (errorMessage.includes('Failed to fetch')) {
        showToast('Connection error: Please check your network connection and ensure the backend server is running.', 'error')
      } else {
        showToast('An unexpected error occurred: ' + errorMessage, 'error')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    setActionLoading(selectedRequest.id)
    try {
      const response = await apiClient.rejectAccessRequest(selectedRequest.id, {
        decisionNote: decisionNote || undefined,
      })

      if (response.success) {
        setShowDecisionModal(null)
        setSelectedRequest(null)
        setDecisionNote('')
        await fetchRequests()
        showToast('Request rejected. An email has been sent to the requester.', 'success')
      } else {
        showToast(response.error || 'Failed to reject request', 'error')
      }
    } catch (err) {
      console.error('Error rejecting request:', err)
        showToast('An unexpected error occurred', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const openDecisionModal = (request: AccessRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setDecisionNote('')
    setShowDecisionModal(action)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  // Check role (backend returns uppercase)
  const userRole = (user?.role || '').toUpperCase()
  if (userRole !== 'ADMIN') {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gray-50">
          <AppHeader title="Access Requests" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <p className="text-red-600">Access denied. Admin role required.</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        <AppHeader title="Access Requests" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Access Requests</h1>
            <p className="text-gray-600 mt-2">Review and manage access requests from students</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as typeof statusFilter)
                    setPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {meta && (
              <div className="mt-4 flex gap-4 text-sm text-gray-600">
                <span>Pending: <strong>{meta.counts.pending}</strong></span>
                <span>Approved: <strong>{meta.counts.approved}</strong></span>
                <span>Rejected: <strong>{meta.counts.rejected}</strong></span>
                <span className="ml-auto">Total: <strong>{meta.total}</strong></span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-red-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold">Error Loading Requests</p>
                  <p className="text-red-600 mt-1">{error}</p>
                  {error.includes('Authentication required') && (
                    <p className="text-sm text-red-500 mt-2">
                      Please <a href="/login" className="underline">sign in again</a> to continue.
                    </p>
                  )}
                  {!error.includes('Authentication required') && !error.includes('401') && (
                    <button
                      onClick={fetchRequests}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Requests Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-600">Loading requests...</p>
              </div>
            </div>
          ) : error && error.includes('Authentication required') ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">Please sign in to view access requests.</p>
              <a href="/login" className="text-blue-600 hover:text-blue-700 underline">Go to Login</a>
            </div>
          ) : requests.length === 0 && !error ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 font-medium">No requests found</p>
              <p className="text-sm text-gray-500 mt-2">
                {statusFilter !== 'ALL' 
                  ? `No ${statusFilter.toLowerCase()} requests match your search.`
                  : 'There are no access requests at this time.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Major</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed By</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.fullName}</div>
                          {request.reason && (
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{request.reason}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{request.desiredRole}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{request.major?.name || '—'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                          {request.isLocked && (
                            <div className="text-xs text-orange-600 mt-1">Locked</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.reviewer ? (
                            <div>
                              <div>{request.reviewer.name}</div>
                              {request.decisionAt && (
                                <div className="text-xs">{formatDate(request.decisionAt)}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'PENDING' && (
                            <div className="flex justify-end gap-2">
                              {(!request.isLocked || request.lockExpired) && (
                                <button
                                  onClick={() => handleLock(request.id)}
                                  disabled={actionLoading === request.id}
                                  className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                >
                                  {actionLoading === request.id ? 'Locking...' : 'Lock'}
                                </button>
                              )}
                              <button
                                onClick={() => openDecisionModal(request, 'approve')}
                                disabled={actionLoading === request.id || (request.isLocked && !request.lockExpired)}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openDecisionModal(request, 'reject')}
                                disabled={actionLoading === request.id || (request.isLocked && !request.lockExpired)}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {request.status !== 'PENDING' && request.decisionNote && (
                            <div className="text-xs text-gray-500 max-w-xs truncate" title={request.decisionNote}>
                              {request.decisionNote}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing {((meta.page - 1) * meta.pageSize) + 1} to {Math.min(meta.page * meta.pageSize, meta.total)} of {meta.total} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Decision Modal */}
          {showDecisionModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">
                  {showDecisionModal === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>{selectedRequest.fullName}</strong> ({selectedRequest.email})
                  </p>
                  <p className="text-sm text-gray-600">
                    Desired Role: <strong>{selectedRequest.desiredRole}</strong>
                  </p>
                  {selectedRequest.major && (
                    <p className="text-sm text-gray-600">
                      Major: <strong>{selectedRequest.major.name}</strong>
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision Note (Optional)
                  </label>
                  <textarea
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={showDecisionModal === 'approve' 
                      ? 'Add a note about the approval...'
                      : 'Explain why the request was rejected...'}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDecisionModal(null)
                      setSelectedRequest(null)
                      setDecisionNote('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showDecisionModal === 'approve' ? handleApprove : handleReject}
                    disabled={actionLoading === selectedRequest.id}
                    className={`px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                      showDecisionModal === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionLoading === selectedRequest.id
                      ? 'Processing...'
                      : showDecisionModal === 'approve'
                      ? 'Approve'
                      : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

