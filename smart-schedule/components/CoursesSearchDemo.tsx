'use client'

import { useEffect, useState } from 'react'
import { useYDoc } from '../lib/useYDoc'
import * as Y from 'yjs'

export function CoursesSearchDemo() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [hasNext, setHasNext] = useState(false)

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

  //  Realtime shared search state
  const { doc, status } = useYDoc('committee-dashboard-search')
  const ySearch = doc.getText('search')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const update = () => setSearch(ySearch.toString())
    ySearch.observe(update)
    update()
    return () => ySearch.unobserve(update)
  }, [ySearch])

  const handleSearchChange = (value: string) => {
    ySearch.delete(0, ySearch.length)
    ySearch.insert(0, value)
    setPage(1)
  }

  //  Fetch courses when search or page changes
  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API}/api/courses?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`
      )
      const json = await res.json()
      setCourses(json?.data ?? [])
      setHasNext((json?.data?.length || 0) === limit)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [search, page])

  return (
    <div className="mt-8 border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Courses{' '}
        </h2>
        <input
          className="border px-3 py-2 rounded w-64"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {courses.map((c) => (
              <li key={c.id} className="border rounded p-3 bg-gray-50">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">{c.code}</div>
                {c.level && <div className="text-xs text-gray-500">Level: {c.level.name}</div>}
              </li>
            ))}
            {courses.length === 0 && (
              <li className="text-sm text-gray-500">No results found</li>
            )}
          </ul>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
      <p className="text-xs text-gray-500 mt-2">
       
      </p>
    </div>
  )
}
