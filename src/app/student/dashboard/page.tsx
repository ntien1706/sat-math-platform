import { getStudentEnrollments } from '@/app/actions/enrollments'
import { getPendingAssignments } from '@/app/actions/test'
import { getStudentDomainStats } from '@/app/actions/analytics'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DomainStatsChart from './DomainStatsChart'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [enrollmentsData, pendingAssignmentsData, statsData] = await Promise.all([
    getStudentEnrollments(),
    getPendingAssignments(),
    getStudentDomainStats()
  ])

  const enrollments = enrollmentsData.success ? enrollmentsData.enrollments : []
  const pendingAssignments = pendingAssignmentsData.success ? pendingAssignmentsData.pendingAssignments : []
  const stats = statsData.success ? statsData.stats : []

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Row: Pending Homework & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Pending Homework */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Homework</h2>

          
          {pendingAssignments && pendingAssignments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="block p-5 border border-red-200 dark:border-red-800/50 rounded-xl bg-red-50/50 dark:bg-red-900/10 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {assignment.moduleName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Class: {assignment.className}
                  </p>
                  
                  <Link 
                    href={`/student/test/${assignment.id}`}
                    className="block w-full py-2 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-medium text-center transition"
                  >
                    Start Test
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-900/20">
              You have no pending homework. Great job!
            </div>
            )}
          </div>

          {/* Analytics Radar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Radar</h2>
              <DomainStatsChart data={stats || []} />
            </div>

            {/* Mistake Bank Shortcut */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-sm p-6 text-white flex flex-col items-center text-center">
              <span className="text-4xl mb-3">🧠</span>
              <h3 className="font-bold text-xl mb-2">The Mistake Bank</h3>
              <p className="text-blue-100 text-sm mb-4">Review missed questions to boost your accuracy.</p>
              <Link 
                href="/student/mistakes"
                className="w-full py-2 bg-white text-blue-700 font-semibold rounded hover:bg-gray-50 transition shadow-sm"
              >
                Open Mistake Bank
              </Link>
            </div>
          </div>

        </div>

        {/* Enrolled Classes */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Enrolled Classes</h2>
          
          {enrollments && enrollments.length === 0 ? (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
