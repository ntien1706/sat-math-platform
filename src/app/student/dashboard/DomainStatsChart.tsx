'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

type StatData = {
  subject: string
  percentage: number
  correct: number
  total: number
}

export default function DomainStatsChart({ data }: { data: StatData[] }) {
  if (!data || data.length === 0 || data.every(d => d.total === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        Not enough data yet. Complete some assignments to see your stats!
      </div>
    )
  }

  return (
    <div className="w-full h-80 flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <Radar 
            name="Accuracy (%)" 
            dataKey="percentage" 
            stroke="#2563eb" 
            fill="#3b82f6" 
            fillOpacity={0.5} 
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as StatData
                return (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded shadow-lg text-sm">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">{data.subject}</p>
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">{data.percentage}% Accuracy</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                      {data.correct} correct out of {data.total} attempts
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
