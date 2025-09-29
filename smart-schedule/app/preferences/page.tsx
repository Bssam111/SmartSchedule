'use client'
import { useState } from 'react'

export default function PreferencesPage() {
	const [userId, setUserId] = useState('U1')
	const [electives, setElectives] = useState('C4;C3')
	const [message, setMessage] = useState('')

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		const payload = { userId, electives: electives.split(';').filter(Boolean), constraints: {} }
		const res = await fetch('/api/preferences', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
		setMessage(res.ok ? 'Saved' : 'Error')
	}

	return (
		<div className="mx-auto max-w-2xl p-4 space-y-4">
			<h1 className="text-xl font-semibold">Student Preferences</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<label className="block text-sm">User ID
					<input value={userId} onChange={e=>setUserId(e.target.value)} className="mt-1 w-full rounded border p-2" />
				</label>
				<label className="block text-sm">Electives (semicolon-separated)
					<input value={electives} onChange={e=>setElectives(e.target.value)} className="mt-1 w-full rounded border p-2" />
				</label>
				<button className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
			</form>
			{message && <div className="text-sm text-gray-600">{message}</div>}
		</div>
	)
}


