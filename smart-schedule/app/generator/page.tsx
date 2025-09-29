'use client'
import { useState } from 'react'

export default function GeneratorPage() {
	const [isLoading, setIsLoading] = useState(false)
	const [result, setResult] = useState<{ scheduleId: string; version: number } | null>(null)

	async function handleGenerate() {
		setIsLoading(true)
		setResult(null)
		try {
			const res = await fetch('/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ seed: 1 }) })
			const data = await res.json()
			setResult(data)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="mx-auto max-w-6xl p-4">
			<h1 className="text-xl font-semibold mb-4">Generator</h1>
			<button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
				{isLoading ? 'Generating…' : 'Generate Preliminary Schedule'}
			</button>
			{result && (
				<div className="mt-4 text-sm">
					Generated schedule: <span className="font-mono">{result.scheduleId}</span> v{result.version}
				</div>
			)}
		</div>
	)
}


