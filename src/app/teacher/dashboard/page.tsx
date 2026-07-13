import { getTeacherClasses } from '@/app/actions/classes'
import CreateClassForm from './CreateClassForm'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { success, classes, error } = await getTeacherClasses()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Teacher Dashboard</h1>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {user.user_metadata?.full_name || user.email}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Create Class */}
          <div className="lg:col-span-1">
            <CreateClassForm />
          </div>

          {/* Right Column: Class List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Classes</h2>
              
              {!success ? (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              ) : classes?.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm italic">
                  You haven't created any classes yet. Use the form to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classes?.map((c) => (
                    <Link
                      key={c.id}
                      href={`/teacher/classes/${c.id}`}
                      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:border-blue-500 hover:shadow-md transition-all group bg-gray-50 dark:bg-gray-800/50"
                    >
                      <h3 className="text-base font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {c.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
