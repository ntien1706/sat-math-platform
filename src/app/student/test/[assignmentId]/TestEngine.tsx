'use client'

import { useState, useEffect, useRef } from 'react'
import { submitTest } from '@/app/actions/test'
import { useRouter } from 'next/navigation'

type Question = {
  id: string
  questionNumber: number
  questionText: string
  imageUrl: string | null
  questionType: 'MCQ' | 'SPR'
  domainTag: string
  choices: Record<string, string> | null
}

type ModuleData = {
  id: string
  title: string
  questions: Question[]
}

type TestEngineProps = {
  assignmentId: string
  moduleData: ModuleData
}

export default function TestEngine({ assignmentId, moduleData }: TestEngineProps) {
  const router = useRouter()
  
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(2100) // 35 minutes
  const [isTimerHidden, setIsTimerHidden] = useState(false)
  const [isGridOpen, setIsGridOpen] = useState(false)
  const [isDesmosOpen, setIsDesmosOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  
  const currentQ = moduleData.questions[currentIdx]

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleForceSubmit()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleAnswer = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }))
  }

  const handleNext = () => {
    if (currentIdx < moduleData.questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
    }
  }

  const initiateSubmit = () => {
    // Check for unanswered
    const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim() !== '').length
    if (answeredCount < moduleData.questions.length) {
      setShowSubmitModal(true)
    } else {
      executeSubmit()
    }
  }

  const handleForceSubmit = () => {
    executeSubmit()
  }

  const executeSubmit = async () => {
    setIsSubmitting(true)
    
    const answersArray = moduleData.questions.map(q => ({
      questionId: q.id,
      studentAnswer: answers[q.id] || null
    }))
    
    const timeElapsed = 2100 - timeLeft

    const res = await submitTest(assignmentId, answersArray, timeElapsed)
    if (res?.error) {
      alert(res.error)
      setIsSubmitting(false)
    } else {
      router.push('/student/dashboard')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans">
      
      {/* Header Bar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{moduleData.title}</h1>
        </div>
        
        <div className="flex-1 flex justify-center items-center gap-6">
          <button 
            onClick={() => setIsDesmosOpen(!isDesmosOpen)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            <span className="text-xl">🖩</span> Desmos Calculator
          </button>
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsTimerHidden(!isTimerHidden)}
                className="text-xs text-blue-600 hover:underline"
              >
                {isTimerHidden ? 'Show' : 'Hide'}
              </button>
              <div className="w-16 text-right font-mono text-lg font-bold">
                {isTimerHidden ? '--:--' : formatTime(timeLeft)}
              </div>
            </div>
            {!isTimerHidden && timeLeft <= 300 && timeLeft > 60 && (
              <span className="text-xs text-amber-600 font-medium">5 Minutes Remaining</span>
            )}
            {!isTimerHidden && timeLeft <= 60 && (
              <span className="text-xs text-red-600 font-bold animate-pulse">1 Minute Remaining</span>
            )}
          </div>
          
          <button 
            onClick={initiateSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Finish Test'}
          </button>
        </div>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Desmos Modal */}
        {isDesmosOpen && (
          <div className="absolute inset-0 z-10 bg-black/20 flex justify-center items-center p-8 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl h-full max-h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
              <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                <span className="font-semibold text-gray-700">Desmos Graphing Calculator</span>
                <button onClick={() => setIsDesmosOpen(false)} className="text-gray-500 hover:text-black text-xl leading-none">&times;</button>
              </div>
              <iframe 
                src="https://www.desmos.com/calculator" 
                className="flex-1 w-full"
                title="Desmos Calculator"
              />
            </div>
          </div>
        )}

        {/* Left Panel: Question */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-200">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <span className="font-bold text-xl">{currentIdx + 1}</span>
            </div>
            
            <div className="text-lg leading-relaxed whitespace-pre-wrap">
              {currentQ.questionText}
            </div>
            
            {currentQ.imageUrl && (
              <div className="mt-6">
                <img src={currentQ.imageUrl} alt="Question Diagram" className="max-w-full rounded-md shadow-sm border border-gray-100" />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Answer Inputs */}
        <div className="w-1/2 p-8 overflow-y-auto bg-gray-50/50">
          <div className="max-w-md mx-auto h-full flex flex-col justify-center">
            
            {currentQ.questionType === 'MCQ' && currentQ.choices && (
              <div className="space-y-4">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const choiceText = currentQ.choices![letter]
                  if (!choiceText) return null
                  const isSelected = answers[currentQ.id] === letter
                  
                  return (
                    <button
                      key={letter}
                      onClick={() => handleAnswer(letter)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all flex gap-4 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50' 
                          : 'border-gray-200 hover:border-gray-300 bg-white shadow-sm'
                      }`}
                    >
                      <div className={`w-8 h-8 flex-shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400 text-gray-500'
                      }`}>
                        {letter}
                      </div>
                      <div className="text-base flex-1 pt-1">{choiceText}</div>
                    </button>
                  )
                })}
              </div>
            )}

            {currentQ.questionType === 'SPR' && (
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
                <label className="block text-sm font-medium text-gray-500 mb-4">
                  Student-Produced Response
                </label>
                <input
                  type="text"
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="w-full text-center text-2xl p-4 border-2 border-gray-300 rounded-md focus:border-blue-600 focus:ring-0 outline-none transition"
                />
              </div>
            )}

          </div>
        </div>

      </main>

      {/* Footer Navigation */}
      <footer className="h-16 border-t border-gray-200 flex justify-between items-center px-6 bg-white relative z-20">
        <div className="w-1/3">
          {/* Reserved for Future features if needed */}
        </div>
        
        <div className="w-1/3 flex justify-center">
          <button 
            onClick={() => setIsGridOpen(!isGridOpen)}
            className="flex items-center gap-2 font-medium px-6 py-2 hover:bg-gray-100 rounded-full transition border border-transparent hover:border-gray-200"
          >
            Question {currentIdx + 1} of {moduleData.questions.length} 
            <span className={`transform transition ${isGridOpen ? 'rotate-180' : ''}`}>⌃</span>
          </button>
        </div>
        
        <div className="w-1/3 flex justify-end gap-4">
          <button 
            onClick={handlePrev} 
            disabled={currentIdx === 0}
            className="px-6 py-2 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-full transition disabled:opacity-30 disabled:border-gray-300 disabled:text-gray-400"
          >
            Back
          </button>
          <button 
            onClick={handleNext} 
            disabled={currentIdx === moduleData.questions.length - 1}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded-full transition disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </footer>

      {/* Navigation Grid Overlay */}
      {isGridOpen && (
        <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-8 z-10 animate-in slide-in-from-bottom-2">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold text-gray-800 mb-6 text-center text-lg">Navigate to Question</h3>
            <div className="grid grid-cols-9 gap-4">
              {moduleData.questions.map((q, idx) => {
                const isAnswered = answers[q.id]?.trim() !== '' && answers[q.id] !== undefined
                const isCurrent = idx === currentIdx
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIdx(idx)
                      setIsGridOpen(false)
                    }}
                    className={`
                      aspect-square rounded-md flex flex-col items-center justify-center border-2 text-lg font-medium transition
                      ${isCurrent ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400'}
                      ${isAnswered ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' : 'bg-white text-gray-700'}
                    `}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Submission Shield Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Unanswered Questions</h2>
            <p className="text-gray-600 text-center mb-8">
              You still have questions left unanswered. Are you sure you want to submit your test now? You cannot change your answers after submitting.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="w-full py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Review Unanswered
              </button>
              <button 
                onClick={executeSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Anyway (I understand)'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
