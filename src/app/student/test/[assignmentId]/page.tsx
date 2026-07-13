import { getTestModuleData } from '@/app/actions/test'
import TestEngine from './TestEngine'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TestPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'student') {
    redirect('/login')
  }

  const { assignmentId } = await params
  const { success, moduleData, error } = await getTestModuleData(assignmentId)

  if (!success || !moduleData || !moduleData.id || moduleData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Load Test</h2>
          <p className="text-gray-600 mb-6">{error || 'Unknown error occurred.'}</p>
          <Link href="/student/dashboard" className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <TestEngine assignmentId={assignmentId} moduleData={moduleData as any} />
}
