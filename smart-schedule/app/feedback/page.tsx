'use client'
import { useState } from 'react'

export default function FeedbackPage() {
	const [scheduleId, setScheduleId] = useState('')
	const [byRole, setByRole] = useState('student')
	const [text, setText] = useState('Looks good!')
	const [rating, setRating] = useState(5)
	const [message, setMessage] = useState('')

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()
		const payload = { scheduleId, byRole, text, rating }
		const res = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
		setMessage(res.ok ? 'Submitted' : 'Error')
	}

	return (
		<div className="mx-auto max-w-2xl p-4 space-y-4">
			<h1 className="text-xl font-semibold">Feedback</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<label className="block text-sm">Schedule ID
					<input value={scheduleId} onChange={e=>setScheduleId(e.target.value)} className="mt-1 w-full rounded border p-2" />
				</label>
				<label className="block text-sm">Role
					<select value={byRole} onChange={e=>setByRole(e.target.value)} className="mt-1 w-full rounded border p-2">
						<option value="student">student</option>
						<option value="faculty">faculty</option>
						<option value="scheduler">scheduler</option>
						<option value="loadCommittee">loadCommittee</option>
						<option value="registrar">registrar</option>
					</select>
				</label>
				<label className="block text-sm">Comment
					<textarea value={text} onChange={e=>setText(e.target.value)} className="mt-1 w-full rounded border p-2 min-h-32" />
				</label>
				<label className="block text-sm">Rating
					<input type="number" value={rating} min={1} max={5} onChange={e=>setRating(Number(e.target.value))} className="mt-1 w-full rounded border p-2" />
				</label>
				<button className="px-4 py-2 rounded bg-blue-600 text-white">Submit</button>
			</form>
			{message && <div className="text-sm text-gray-600">{message}</div>}
		</div>
	)
}


