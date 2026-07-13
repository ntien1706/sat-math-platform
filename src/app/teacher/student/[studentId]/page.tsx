import { getStudentDeepDive } from '@/app/actions/teacherAnalytics'
import { getStudentDomainStats } from '@/app/actions/analytics'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DomainStatsChart from '@/app/student/dashboard/DomainStatsChart'

export default async function TeacherStudentProfile({ params }: { params: Promise<{ studentId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  const { studentId } = await params

  const [deepDiveData, statsData] = await Promise.all([
    getStudentDeepDive(studentId),
    getStudentDomainStats(studentId)
  ])

  const { success, logs, studentName, error } = deepDiveData
  const stats = statsData.success ? statsData.stats : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/teacher/dashboard" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            &larr; Dashboard
          </Link>
          <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Student Profile: <span className="text-blue-600 dark:text-blue-400">{studentName || 'Loading...'}</span>
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!success ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-lg">
            {error || 'Failed to load student data.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Analytics Chart */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">4-Domain Accuracy</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  This radar chart exactly mirrors what the student sees, omitting remembered mistakes from active penalty.
                </p>
                <DomainStatsChart data={stats || []} />
              </div>
            </div>

            {/* Right Col: Completed Modules Log */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submission History</h2>
                </div>
                
                {logs && logs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {logs.map((log) => {
                          const m = Math.floor(log.timeElapsed / 60)
                          const s = log.timeElapsed % 60
                          const timeStr = `${m}m ${s}s`
                          const scorePerc = Math.round((log.rawScore / 27) * 100)
                          
                          return (
                            <tr key={log.submissionId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {log.moduleName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(log.submittedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`font-semibold ${scorePerc >= 80 ? 'text-green-600' : scorePerc >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                  {log.rawScore} / 27
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {timeStr}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link 
                                  href={`/teacher/review/${log.submissionId}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition"
                                >
                                  Review Test &rarr;
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    This student has not completed any assignments yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
