import { getSubmissionReview } from '@/app/actions/teacherAnalytics'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SubmissionReviewInteractive from './SubmissionReviewInteractive'
import BackButton from './BackButton'

export default async function TeacherTestReviewPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const { submissionId } = await params
  const { success, reviewData, error } = await getSubmissionReview(submissionId)

  if (!success || !reviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Review Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unknown error occurred.'}</p>
          <Link href="/teacher/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { studentName, rawScore, timeElapsed, answers } = reviewData
  const scorePerc = Math.round((rawScore / 27) * 100)
  const timeStr = `${Math.floor(timeElapsed / 60)}m ${timeElapsed % 60}s`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Test Review: <span className="text-blue-600 dark:text-blue-400">{studentName}</span>
            </h1>
          </div>
          <div className="flex gap-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase text-gray-500">Final Score</span>
              <span className={`text-base font-bold ${scorePerc >= 80 ? 'text-green-600' : scorePerc >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {rawScore} / 27 ({scorePerc}%)
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs uppercase text-gray-500">Time Taken</span>
              <span className="text-base font-bold">{timeStr}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubmissionReviewInteractive answers={answers as any} />
      </main>
    </div>
  )
}
