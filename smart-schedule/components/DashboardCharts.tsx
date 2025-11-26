'use client'

interface ChartData {
  courses: Array<{ label: string; value: number }>
  sections: Array<{ label: string; value: number }>
  enrollments: Array<{ label: string; value: number }>
  schedules: Array<{ label: string; value: number }>
}

interface DashboardChartsProps {
  data: ChartData
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const maxValue = (items: Array<{ value: number }>) => {
    return Math.max(...items.map(item => item.value), 1)
  }

  const BarChart = ({ items, title }: { items: Array<{ label: string; value: number }>; title: string }) => {
    const max = maxValue(items)
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
        {items.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-900">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const PieChart = ({ items, title }: { items: Array<{ label: string; value: number }>; title: string }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0)
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    
    let currentAngle = 0
    const segments = items.map((item, index) => {
      const percentage = (item.value / total) * 100
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      currentAngle += angle
      
      return {
        ...item,
        percentage,
        startAngle,
        angle,
        color: colors[index % colors.length],
      }
    })

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
        <div className="flex items-center space-x-4">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {segments.map((segment, index) => {
                const largeArcFlag = segment.angle > 180 ? 1 : 0
                const x1 = 50 + 50 * Math.cos((segment.startAngle * Math.PI) / 180)
                const y1 = 50 + 50 * Math.sin((segment.startAngle * Math.PI) / 180)
                const x2 = 50 + 50 * Math.cos(((segment.startAngle + segment.angle) * Math.PI) / 180)
                const y2 = 50 + 50 * Math.sin(((segment.startAngle + segment.angle) * Math.PI) / 180)
                
                return (
                  <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={segment.color}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                )
              })}
            </svg>
          </div>
          <div className="flex-1 space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xs text-gray-600">{segment.label}</span>
                <span className="text-xs font-medium text-gray-900 ml-auto">
                  {segment.value} ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <BarChart items={data.courses} title="Courses by Department" />
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <BarChart items={data.sections} title="Sections Over Time" />
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <PieChart items={data.enrollments} title="Enrollments by Level" />
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <PieChart items={data.schedules} title="Schedule Status" />
      </div>
    </div>
  )
}


