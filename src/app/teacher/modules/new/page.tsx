export const dynamic = 'force-dynamic';
import ModuleCreator from './ModuleCreator'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewModulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'teacher') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ModuleCreator />
    </div>
  )
}
