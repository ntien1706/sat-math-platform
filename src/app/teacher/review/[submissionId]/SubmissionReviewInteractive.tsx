'use client'

import { useState } from 'react'

type ReviewAnswer = {
  questionNumber: number
  questionText: string
  imageUrl: string | null
  correctAnswer: string
  questionType: 'MCQ' | 'SPR'
  domainTag: string
  studentAnswer: string | null
  isCorrect: boolean
}

export default function SubmissionReviewInteractive({ answers }: { answers: ReviewAnswer[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const selectedAnswer = selectedIdx !== null ? answers[selectedIdx] : null

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* Left Col: The 27-Question Grid */}
      <div className="lg:w-1/3">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Test Grid</h2>
          <div className="grid grid-cols-5 gap-3">
            {answers.map((ans, idx) => {
              const isSelected = selectedIdx === idx
              
              let bgColor = 'bg-gray-100 text-gray-400 border-gray-200' // Unanswered
              if (ans.studentAnswer) {
                bgColor = ans.isCorrect 
                  ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' 
                  : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
              }

              return (
                <button
                  key={ans.questionNumber}
                  onClick={() => setSelectedIdx(idx)}
                  className={`
                    aspect-square rounded-md flex items-center justify-center font-bold text-lg border transition-all
                    ${bgColor}
                    ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md' : ''}
                  `}
                >
                  {ans.questionNumber}
                </button>
              )
            })}
          </div>

          <div className="mt-8 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border border-green-300 rounded-sm"></div> Correct</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded-sm"></div> Incorrect</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded-sm"></div> Unanswered</div>
          </div>
        </div>
      </div>

      {/* Right Col: Interactive Review Panel */}
      <div className="lg:w-2/3">
        {selectedAnswer ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">
                Question {selectedAnswer.questionNumber}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {selectedAnswer.domainTag} &bull; {selectedAnswer.questionType}
              </span>
            </div>

            <div className="p-6">
              <p className="text-gray-900 dark:text-gray-100 text-lg mb-6 whitespace-pre-wrap">
                {selectedAnswer.questionText}
              </p>
              
              {selectedAnswer.imageUrl && (
                <img src={selectedAnswer.imageUrl} alt="Question Diagram" className="mb-6 max-h-64 rounded-md border border-gray-200" />
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className={`p-4 rounded-lg border ${
                  selectedAnswer.studentAnswer 
                    ? (selectedAnswer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className={`text-xs font-semibold uppercase mb-1 ${
                    selectedAnswer.studentAnswer 
                      ? (selectedAnswer.isCorrect ? 'text-green-800' : 'text-red-800')
                      : 'text-gray-500'
                  }`}>
                    Student Answer
                  </p>
                  <p className={`text-lg font-bold ${
                    selectedAnswer.studentAnswer 
                      ? (selectedAnswer.isCorrect ? 'text-green-600' : 'text-red-600')
                      : 'text-gray-400 italic'
                  }`}>
                    {selectedAnswer.studentAnswer || 'Blank'}
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase mb-1">Correct Answer</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-300">
                    {selectedAnswer.correctAnswer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 h-full min-h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
            Click a question number in the grid to review it.
          </div>
        )}
      </div>

    </div>
  )
}
