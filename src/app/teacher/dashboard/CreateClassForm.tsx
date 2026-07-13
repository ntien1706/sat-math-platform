'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useTransition } from 'react'
import { createClass } from '@/app/actions/classes'
import { useRouter } from 'next/navigation'

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100, 'Class name is too long'),
})

type CreateClassValues = z.infer<typeof createClassSchema>

export default function CreateClassForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
  })

  const onSubmit = (data: CreateClassValues) => {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', data.name)
      
      const result = await createClass(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        reset()
        // Optional: navigate directly to the new class or let Server Action revalidate
        // router.push(`/teacher/classes/${result.classId}`)
      }
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Class</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Class Name
          </label>
          <div className="mt-1 flex gap-3">
            <div className="flex-grow">
              <input
                id="name"
                type="text"
                placeholder="e.g., SAT Prep Fall 2026"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                {...register('name')}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? 'Creating...' : 'Create Class'}
            </button>
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>
      </form>
    </div>
  )
}
