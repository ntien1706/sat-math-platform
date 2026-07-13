import { getStudentEnrollments } from '@/app/actions/enrollments'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { success, enrollments, error } = await getStudentEnrollments()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Student Dashboard</h1>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Welcome, {user.user_metadata?.full_name || user.email}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Enrolled Classes</h2>
          
          {!success ? (
            <div className="text-red-600 dark:text-red-400 text-sm">{error || 'Failed to load enrollments'}</div>
          ) : enrollments?.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20">
              You are not enrolled in any classes yet. Your teacher needs to add you using your registered email address ({user.email}).
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {enrollments?.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="block p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {enrollment.name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Teacher:</span> {enrollment.teacherName}
                    </p>
                    <p>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Enrolled:</span> {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  {/* Placeholder for future assignment link */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button disabled className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded text-sm font-medium cursor-not-allowed text-center">
                      Assignments (Coming Soon)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
