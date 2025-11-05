'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// نسجل كل المطلوب مرة وحدة
if (!ChartJS.registry.controllers.get('line')) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )
}

type Point = { week: string; utilizationPct: number }

export function UtilizationTrend({ data }: { data: Point[] }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-2">Room Utilization</h3>
      <Line
        data={{
          labels: data.map(p => p.week),
          datasets: [
            { label: 'Utilization %', data: data.map(p => p.utilizationPct) }
          ]
        }}
        options={{
          responsive: true,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { min: 0, max: 100 } }
        }}
      />
    </div>
  )
}
