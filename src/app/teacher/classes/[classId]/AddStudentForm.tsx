'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useTransition } from 'react'
import { addStudentByEmail } from '@/app/actions/enrollments'

const addStudentSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type AddStudentValues = z.infer<typeof addStudentSchema>

export default function AddStudentForm({ classId }: { classId: string }) {
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddStudentValues>({
    resolver: zodResolver(addStudentSchema),
  })

  const onSubmit = (data: AddStudentValues) => {
    setMessage(null)
    startTransition(async () => {
      const result = await addStudentByEmail(classId, data.email)
      
      if (result?.error) {
        setMessage({ type: 'error', text: result.error })
      } else if (result?.success) {
        setMessage({ type: 'success', text: `Student ${data.email} enrolled successfully.` })
        reset()
      }
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Enroll a Student</h3>
      
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-md text-sm border ${
          message.type === 'error' 
            ? 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' 
            : 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Student Email
          </label>
          <div className="mt-1 flex gap-3">
            <div className="flex-grow">
              <input
                id="email"
                type="email"
                placeholder="student@example.com"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                {...register('email')}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? 'Adding...' : 'Add Student'}
            </button>
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>
      </form>
    </div>
  )
}
