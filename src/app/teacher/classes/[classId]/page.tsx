export const dynamic = 'force-dynamic';
import Link from 'next/link'
import { getTeacherModules, getClassAssignments } from '@/app/actions/assignments'
import { getClassProgressOverview } from '@/app/actions/teacherAnalytics'
import AddStudentForm from './AddStudentForm'
import AssignModuleForm from './AssignModuleForm'

export default async function ClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params

  const [progressData, modulesData, assignmentsData] = await Promise.all([
    getClassProgressOverview(classId),
    getTeacherModules(),
    getClassAssignments(classId)
  ])

  // If we had the class name from getRoster, we'll need to fetch it separately or just use ID
  // For simplicity since overview doesn't return className, we'll say Class Details
  const roster = progressData.success ? progressData.overview : []
  const rosterError = progressData.error
  const rosterSuccess = progressData.success
  const modules = modulesData.success ? modulesData.modules : []
  const assignmentsList = assignmentsData.success ? assignmentsData.assignments : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-4 items-center">
          <Link href="/teacher/dashboard" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            &larr; Back to Dashboard
          </Link>
          <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Class Details
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!rosterSuccess ? (
          <div className="bg-red-50 dark:bg-red-900/50 p-6 rounded-lg text-red-600 dark:text-red-400">
            {rosterError || 'Failed to load class details.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Tools */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <AddStudentForm classId={classId} />
              
              <AssignModuleForm classId={classId} modules={modules || []} />
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Class Info</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono text-xs break-all">ID: {classId}</p>
              </div>
            </div>

            {/* Right Column: Roster & Assignments */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Assignments List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Assignments</h2>
                </div>
                
                {assignmentsList && assignmentsList.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assignmentsList.map((assignment) => (
                      <li key={assignment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">{assignment.moduleName}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 italic text-sm">
                    No assignments active for this class.
                  </div>
                )}
              </div>

              {/* Roster Table */}
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
                            Student
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Completion
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Accuracy
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {roster.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{student.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600" style={{ width: `${student.completionRate}%` }}></div>
                                </div>
                                <span>{student.completedAssignments}/{student.totalAssignments}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              <span className={`font-semibold ${student.accuracy >= 80 ? 'text-green-600' : student.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                                {student.totalAssignments > 0 ? `${student.accuracy}%` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link href={`/teacher/student/${student.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                View Profile
                              </Link>
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
