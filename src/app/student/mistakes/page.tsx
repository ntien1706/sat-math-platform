import { getStudentMistakes } from '@/app/actions/analytics'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MistakeList from './MistakeList'

export default async function MistakeBankPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'student') {
    redirect('/login')
  }

  const { success, mistakes, error } = await getStudentMistakes()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🧠</span> Mistake Bank
          </h1>
          <a href="/student/dashboard" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Back to Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {!success ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
            {error || 'Failed to load mistakes.'}
          </div>
        ) : (
          <MistakeList mistakes={mistakes || []} />
        )}
      </main>
    </div>
  )
}
