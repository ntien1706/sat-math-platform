import Link from 'next/link'
import { getClassRoster } from '@/app/actions/enrollments'
import AddStudentForm from './AddStudentForm'

export default async function ClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params

  const { success, roster, className, error } = await getClassRoster(classId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-4 items-center">
          <Link href="/teacher/dashboard" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            &larr; Back to Dashboard
          </Link>
          <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {className || 'Class Details'}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!success ? (
          <div className="bg-red-50 dark:bg-red-900/50 p-6 rounded-lg text-red-600 dark:text-red-400">
            {error || 'Failed to load class details.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Tools */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <AddStudentForm classId={classId} />
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Class Info</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono text-xs break-all">ID: {classId}</p>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  More management tools (Assignments, Modules) will go here.
                </p>
              </div>
            </div>

            {/* Right Column: Roster */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Class Roster</h2>
                </div>
                
                {roster && roster.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Enrolled
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {roster.map((student) => (
                          <tr key={student.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {student.fullName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {student.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 italic text-sm">
                    No students are enrolled in this class yet.
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
