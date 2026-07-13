'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { parseBulkQuestions, type ParsedQuestion } from '@/lib/utils/parser'
import { createModuleWithQuestions, uploadQuestionImage } from '@/app/actions/modules'
import { useRouter } from 'next/navigation'

type FormValues = {
  title: string
  questions: ParsedQuestion[]
}

export default function ModuleCreator() {
  const [view, setView] = useState<'BULK' | 'EDIT'>('BULK')
  const [bulkText, setBulkText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { control, handleSubmit, register, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: '',
      questions: Array.from({ length: 27 }).map((_, i) => ({
        questionNumber: i + 1,
        questionText: '',
        questionType: 'MCQ',
        domainTag: 'Algebra',
        choices: { A: '', B: '', C: '', D: '' },
        correctAnswer: ''
      }))
    }
  })

  const { fields } = useFieldArray({
    control,
    name: 'questions'
  })

  const handleParse = () => {
    const parsed = parseBulkQuestions(bulkText)
    setValue('questions', parsed)
    setView('EDIT')
  }

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    // Optional: show local loading state here if needed
    const res = await uploadQuestionImage(formData)
    if (res.error) {
      alert(res.error)
    } else if (res.url) {
      setValue(`questions.${index}.imageUrl`, res.url)
    }
  }

  const onSubmit = (data: FormValues) => {
    setError(null)
    startTransition(async () => {
      const res = await createModuleWithQuestions(data)
      if (res.error) {
        setError(res.error)
      } else {
        // Redirect back to dashboard (or a module list)
        router.push('/teacher/dashboard')
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Module</h1>
        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setView('BULK')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'BULK' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Bulk Parser
          </button>
          <button
            onClick={() => setView('EDIT')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${view === 'EDIT' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Manual Edit
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {view === 'BULK' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-2">Token Format Instructions:</p>
            <p>Use the following tokens to format your questions. Separate questions with a double line break.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>[Q]</strong> Question text</li>
              <li><strong>[TYPE]</strong> MCQ or SPR</li>
              <li><strong>[TAG]</strong> Algebra, Advanced Math, Problem-Solving, or Geometry/Trig</li>
              <li><strong>[A], [B], [C], [D]</strong> Choices for MCQ</li>
              <li><strong>[ANS]</strong> Correct Answer (A, B, C, D, or numeric for SPR)</li>
            </ul>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm dark:bg-gray-800 dark:text-white"
            placeholder="[Q] If 2x = 4, what is x?&#10;[TYPE] MCQ&#10;[TAG] Algebra&#10;[A] 1&#10;[B] 2&#10;[C] 3&#10;[D] 4&#10;[ANS] B"
          />
          <button
            onClick={handleParse}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Parse Questions &rarr;
          </button>
        </div>
      )}

      {view === 'EDIT' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Module Title</label>
            <input
              {...register('title', { required: true })}
              className="w-full text-xl font-bold p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900 dark:text-white"
              placeholder="e.g., Practice Test 1 - Math Module 1"
            />
          </div>

          <div className="space-y-6">
            {fields.map((field, index) => {
              const qType = watch(`questions.${index}.questionType`)
              return (
                <div key={field.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Question {index + 1}</h3>
                    <div className="flex gap-4">
                      <select
                        {...register(`questions.${index}.questionType`)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="SPR">SPR</option>
                      </select>
                      <select
                        {...register(`questions.${index}.domainTag`)}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Algebra">Algebra</option>
                        <option value="Advanced Math">Advanced Math</option>
                        <option value="Problem-Solving">Problem-Solving</option>
                        <option value="Geometry/Trig">Geometry/Trig</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question Text</label>
                      <textarea
                        {...register(`questions.${index}.questionText`, { required: true })}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md h-24 dark:bg-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diagram/Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                        className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-white"
                      />
                      {watch(`questions.${index}.imageUrl`) && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">&check; Uploaded</span>
                      )}
                    </div>

                    {qType === 'MCQ' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                        {['A', 'B', 'C', 'D'].map((letter) => (
                          <div key={letter} className="flex gap-2 items-center">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{letter}.</span>
                            <input
                              {...register(`questions.${index}.choices.${letter}` as const)}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correct Answer</label>
                      <input
                        {...register(`questions.${index}.correctAnswer`, { required: true })}
                        className="w-full md:w-1/3 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder={qType === 'MCQ' ? "A, B, C, or D" : "e.g., 2.5"}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isPending ? 'Publishing Module...' : 'Publish Module'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
