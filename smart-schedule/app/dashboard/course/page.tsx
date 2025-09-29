'use client'
import { useEffect, useState } from 'react'

type CourseRow = { code: string; sections: number }

export default function CourseDashboard() {
	const [rows, setRows] = useState<CourseRow[]>([])
	useEffect(() => {
		fetch('/api/dashboard/course').then(r => r.json()).then(setRows).catch(() => setRows([]))
	}, [])
	return (
		<div className="mx-auto max-w-6xl p-4">
			<h1 className="text-xl font-semibold mb-4">Course Overview</h1>
			<ul className="space-y-2">
				{rows.map(r => (
					<li key={r.code} className="rounded border bg-white p-3 flex items-center justify-between">
						<span className="font-mono">{r.code}</span>
						<span className="text-sm text-gray-600">Sections: {r.sections}</span>
					</li>
				))}
			</ul>
		</div>
	)
}


