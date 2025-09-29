'use client'
import { useEffect, useState } from 'react'

type LevelRow = { name: string; sections: number; target: number }

export default function LevelDashboard() {
	const [rows, setRows] = useState<LevelRow[]>([])
	useEffect(() => {
		fetch('/api/dashboard/level').then(r => r.json()).then(setRows).catch(() => setRows([]))
	}, [])
	return (
		<div className="mx-auto max-w-6xl p-4">
			<h1 className="text-xl font-semibold mb-4">Level Overview</h1>
			<div className="grid md:grid-cols-2 gap-4">
				{rows.map(r => (
					<div key={r.name} className="rounded border bg-white p-4">
						<div className="font-medium">{r.name}</div>
						<div className="text-sm text-gray-600">Sections: {r.sections} • Target: {r.target}</div>
					</div>
				))}
			</div>
		</div>
	)
}


