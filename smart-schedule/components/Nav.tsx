'use client'
import Link from 'next/link'

export function Nav() {
	return (
		<nav className="w-full border-b bg-white">
			<div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
				<Link href="/" className="font-semibold">SmartSchedule</Link>
				<div className="flex gap-4 text-sm">
					<Link href="/imports">Imports</Link>
					<Link href="/rules">Rules</Link>
					<Link href="/generator">Generator</Link>
				</div>
			</div>
		</nav>
	)
}


