import Link from 'next/link'

const personas = [
  {
    title: 'Students',
    description:
      'Review your enrolled courses, personalized schedules, and real-time updates as the committee assigns you to classes. Manage preferences and stay ahead with live dashboards.',
    actions: [
      'Track upcoming classes with live schedules',
      'Review enrolled courses and credits instantly',
      'Receive updates when sections or assignments change'
    ],
    accent: 'from-emerald-500/20 to-emerald-300/10',
    badge: 'Learn & Engage'
  },
  {
    title: 'Faculty',
    description:
      'Manage teaching assignments, monitor roster changes, and optimize office hours. SmartSchedule keeps your sections, rooms, and student lists in sync.',
    actions: [
      'View upcoming sections with room & meeting details',
      'Get immediate roster updates when committee enrolls students',
      'Share availability and balance workload'
    ],
    accent: 'from-sky-500/20 to-sky-300/10',
    badge: 'Teach & Mentor'
  },
  {
    title: 'Committee',
    description:
      'Design conflict-free schedules, enroll students, and assign faculty with confidence. Robust validation, analytics, and live updates ensure every decision is informed.',
    actions: [
      'Create sections with built-in conflict detection',
      'Enroll students and instantly update their dashboards',
      'Analyze capacity, assignments, and schedule health'
    ],
    accent: 'from-indigo-500/20 to-indigo-300/10',
    badge: 'Plan & Orchestrate'
  }
]

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-[600px] w-[600px] bg-indigo-500/30 rounded-full blur-3xl absolute -top-40 -left-20" />
        <div className="h-[500px] w-[500px] bg-blue-500/30 rounded-full blur-3xl absolute top-40 right-0" />
      </div>

      <div className="relative z-10">
        <header className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-200/70 mb-4">
                SmartSchedule Platform
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                A unified workspace for{' '}
                <span className="text-indigo-300">Students, Faculty,</span> and{' '}
                <span className="text-blue-300">Committee</span>
              </h1>
              <p className="mt-6 text-lg text-slate-200/80 leading-relaxed">
                SmartSchedule orchestrates academic planning end-to-end. Whether you’re enrolling in
                classes, assigning instructors, or coordinating course offerings, every role sees
                personalized insights, live updates, and streamlined workflows.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold shadow-lg shadow-white/10 hover:scale-[1.02] transition-transform"
                >
                  Sign In to Continue
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  Request Access
                </Link>
              </div>
            </div>

            <div className="lg:max-w-xl w-full">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 shadow-2xl">
                <p className="text-xs uppercase tracking-widest text-slate-200/70 mb-3">
                  Real-time insight
                </p>
                <div className="bg-slate-900/70 rounded-xl p-5 border border-white/5">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Live Metrics</span>
                    <span>Updated moments ago</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/60 rounded-lg p-4">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                        Students Enrolled
                      </p>
                      <p className="text-3xl font-semibold text-indigo-200">1,248</p>
                      <p className="text-xs text-slate-400 mt-1">+18 today</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                        Sections Active
                      </p>
                      <p className="text-3xl font-semibold text-blue-200">132</p>
                      <p className="text-xs text-slate-400 mt-1">+6 this week</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                        Faculty Assigned
                      </p>
                      <p className="text-3xl font-semibold text-emerald-200">84</p>
                      <p className="text-xs text-slate-400 mt-1">100% coverage</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4">
                      <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">
                        Conflicts Resolved
                      </p>
                      <p className="text-3xl font-semibold text-rose-200">27</p>
                      <p className="text-xs text-slate-400 mt-1">this semester</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid gap-8 lg:grid-cols-3">
            {personas.map((persona, idx) => (
              <div
                key={persona.title}
                className={`rounded-2xl border border-white/10 bg-gradient-to-br ${persona.accent} p-6 shadow-2xl`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-[0.25em] text-white/70">
                    {persona.title}
                  </span>
                  <span className="text-[11px] px-3 py-1 rounded-full bg-white/20 text-white/80">
                    {persona.badge}
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">{persona.description}</p>
                <ul className="mt-5 space-y-3 text-sm text-white/90">
                  {persona.actions.map(action => (
                    <li key={action} className="flex items-start space-x-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70 inline-flex" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm font-semibold text-white hover:text-indigo-100 transition-colors"
                  >
                    Access Portal
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
