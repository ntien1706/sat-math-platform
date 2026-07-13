'use client'

import { useState, useTransition } from 'react'
import { toggleMistakeRemembered } from '@/app/actions/analytics'

type Mistake = {
  id: string
  studentInput: string | null
  correctAnswer: string
  isRemembered: boolean
  addedAt: Date
  questionId: string
  questionText: string
  imageUrl: string | null
  domainTag: string
  questionType: 'MCQ' | 'SPR'
  choices: any // JSONB
}

export default function MistakeList({ mistakes }: { mistakes: Mistake[] }) {
  const [view, setView] = useState<'ACTIVE' | 'ALL'>('ACTIVE')
  const [isPending, startTransition] = useTransition()

  const displayedMistakes = view === 'ACTIVE' 
    ? mistakes.filter(m => !m.isRemembered)
    : mistakes

  const handleToggle = (mistakeId: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleMistakeRemembered(mistakeId, currentStatus)
    })
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-max mx-auto mb-8">
        <button
          onClick={() => setView('ACTIVE')}
          className={`px-6 py-2 text-sm font-bold rounded-md transition ${view === 'ACTIVE' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Active Focus ({mistakes.filter(m => !m.isRemembered).length})
        </button>
        <button
          onClick={() => setView('ALL')}
          className={`px-6 py-2 text-sm font-bold rounded-md transition ${view === 'ALL' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Night-Before Review ({mistakes.length})
        </button>
      </div>

      {/* Mistake Feed */}
      {displayedMistakes.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">You're all caught up!</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {view === 'ACTIVE' 
              ? "You have no active mistakes to review. Keep up the great work!" 
              : "Your mistake bank is completely empty."}
          </p>
        </div>
      ) : (
        <div className="space-y-8 max-w-3xl mx-auto">
          {displayedMistakes.map(mistake => (
            <div key={mistake.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg">
              
              {/* Card Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {mistake.domainTag}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Missed on {new Date(mistake.addedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Question Content */}
              <div className="p-6">
                <p className="text-gray-900 dark:text-gray-100 text-lg mb-6 whitespace-pre-wrap">
                  {mistake.questionText}
                </p>
                {mistake.imageUrl && (
                  <img src={mistake.imageUrl} alt="Question Diagram" className="mb-6 max-h-64 rounded-md border border-gray-200" />
                )}
                
                {/* Answer Display */}
                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                    <p className="text-xs font-semibold text-red-800 dark:text-red-400 uppercase mb-1">Your Answer</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-500">
                      {mistake.studentInput || <span className="italic opacity-75">Blank</span>}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50">
                    <p className="text-xs font-semibold text-green-800 dark:text-green-400 uppercase mb-1">Correct Answer</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-500">
                      {mistake.correctAnswer}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => handleToggle(mistake.id, mistake.isRemembered)}
                  disabled={isPending}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-all shadow-sm disabled:opacity-50 ${
                    mistake.isRemembered 
                      ? 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md border border-transparent'
                  }`}
                >
                  {isPending ? 'Updating...' : mistake.isRemembered ? 'Mark as Active' : 'Mark as Remembered'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
