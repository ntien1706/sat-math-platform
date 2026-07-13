'use server'

import { db } from '@/lib/db'
import { classes } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100, 'Class name is too long'),
})

export async function createClass(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized' }
  }

  // Ensure only teachers can create classes
  if (user.user_metadata?.role !== 'teacher') {
    return { error: 'Only teachers can create classes' }
  }

  const name = formData.get('name') as string
  const parsed = createClassSchema.safeParse({ name })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    const newClass = await db.insert(classes).values({
      teacherId: user.id,
      name: parsed.data.name,
    }).returning()

    revalidatePath('/teacher/dashboard')
    return { success: true, classId: newClass[0].id }
  } catch (error) {
    console.error('Error creating class:', error)
    return { error: 'Failed to create class. Please try again.' }
  }
}

export async function getTeacherClasses() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized', classes: [] }
  }

  try {
    const teacherClasses = await db.query.classes.findMany({
      where: eq(classes.teacherId, user.id),
      orderBy: [desc(classes.createdAt)],
    })

    return { success: true, classes: teacherClasses }
  } catch (error) {
    console.error('Error fetching classes:', error)
    return { error: 'Failed to fetch classes', classes: [] }
  }
}
