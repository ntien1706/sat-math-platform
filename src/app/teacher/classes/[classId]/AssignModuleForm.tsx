'use client'

import { useState, useTransition } from 'react'
import { assignModuleToClass } from '@/app/actions/assignments'

export default function AssignModuleForm({ classId, modules }: { classId: string, modules: any[] }) {
  const [selectedModule, setSelectedModule] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleAssign = () => {
    if (!selectedModule) return
    setMessage(null)
    startTransition(async () => {
      const res = await assignModuleToClass(selectedModule, classId)
      if (res?.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        setMessage({ type: 'success', text: 'Module successfully assigned!' })
        setSelectedModule('')
      }
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Assign Homework</h3>
      
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-md text-sm border ${
          message.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/50 dark:border-red-800 dark:text-red-400' 
            : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/50 dark:border-green-800 dark:text-green-400'
        }`}>
          {message.text}
        </div>
      )}

      {modules.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          You haven't created any modules yet. Go to your dashboard to create one.
        </div>
      ) : (
        <div className="flex gap-3">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a module...</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedModule || isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      )}
    </div>
  )
}
