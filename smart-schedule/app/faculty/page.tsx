'use client'
import { useState } from 'react'

export default function FacultyAvailabilityPage() {
	const [userId, setUserId] = useState('U2')
	const [availability, setAvailability] = useState('[{"dayOfWeek":1,"start":"08:00","end":"12:00"}]')
	const [message, setMessage] = useState('')

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		try {
			const payload = { userId, availability: JSON.parse(availability) }
			const res = await fetch('/api/faculty/availability', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
			setMessage(res.ok ? 'Saved' : 'Error')
		} catch {
			setMessage('Invalid JSON')
		}
	}

	return (
		<div className="mx-auto max-w-2xl p-4 space-y-4">
			<h1 className="text-xl font-semibold">Faculty Availability</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<label className="block text-sm">User ID
					<input value={userId} onChange={e=>setUserId(e.target.value)} className="mt-1 w-full rounded border p-2" />
				</label>
				<label className="block text-sm">Availability JSON
					<textarea value={availability} onChange={e=>setAvailability(e.target.value)} className="mt-1 w-full rounded border p-2 min-h-32" />
				</label>
				<button className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
			</form>
			{message && <div className="text-sm text-gray-600">{message}</div>}
		</div>
	)
}


