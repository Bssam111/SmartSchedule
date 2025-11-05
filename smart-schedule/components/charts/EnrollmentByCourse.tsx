'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

import { Bar } from 'react-chartjs-2'

// ثبت المقاييس لو مو مسجلة
if (!ChartJS.registry.controllers.get('bar')) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
  )
}

type Datum = { course: string; enrolled: number }

export function EnrollmentByCourse({ data }: { data: Datum[] }) {
  const labels = data.map(d => d.course)
  const values = data.map(d => d.enrolled)

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-2">Enrollment by Course</h3>
      <Bar
        data={{
          labels,
          datasets: [{ label: 'Students', data: values }]
        }}
        options={{
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
          scales: { x: { ticks: { maxRotation: 0 } } }
        }}
      />
    </div>
  )
}
