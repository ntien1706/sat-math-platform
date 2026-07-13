'use server'

import { db } from '@/lib/db'
import { assignments, modules, classes } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function assignModuleToClass(moduleId: string, classId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' }
  }

  try {
    // Check if class exists and belongs to the teacher
    const targetClass = await db.query.classes.findFirst({
      where: and(eq(classes.id, classId), eq(classes.teacherId, user.id)),
    })

    if (!targetClass) {
      return { error: 'Class not found or unauthorized' }
    }

    // Check if module exists and belongs to teacher
    const targetModule = await db.query.modules.findFirst({
      where: and(eq(modules.id, moduleId), eq(modules.createdBy, user.id)),
    })

    if (!targetModule) {
      return { error: 'Module not found or unauthorized' }
    }

    // Check if already assigned
    const existingAssignment = await db.query.assignments.findFirst({
      where: and(
        eq(assignments.classId, classId),
        eq(assignments.moduleId, moduleId)
      ),
    })

    if (existingAssignment) {
      return { error: 'This module is already assigned to this class' }
    }

    // Insert assignment
    await db.insert(assignments).values({
      classId,
      moduleId,
    })

    revalidatePath(`/teacher/classes/${classId}`)
    return { success: true }
  } catch (error) {
    console.error('Error assigning module:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getTeacherModules() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized', modules: [] }
  }

  try {
    const teacherModules = await db.query.modules.findMany({
      where: eq(modules.createdBy, user.id),
      orderBy: [desc(modules.createdAt)],
    })

    return { success: true, modules: teacherModules }
  } catch (error) {
    console.error('Error fetching modules:', error)
    return { error: 'Failed to fetch modules', modules: [] }
  }
}

export async function getClassAssignments(classId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized', assignments: [] }
  }

  try {
    // Verify teacher owns the class
    const targetClass = await db.query.classes.findFirst({
      where: and(eq(classes.id, classId), eq(classes.teacherId, user.id)),
    })

    if (!targetClass) {
      return { error: 'Class not found', assignments: [] }
    }

    // Fetch assignments using join
    const classAssignments = await db
      .select({
        id: assignments.id,
        moduleId: assignments.moduleId,
        moduleName: modules.title,
        assignedAt: assignments.assignedAt,
        dueDate: assignments.dueDate,
      })
      .from(assignments)
      .innerJoin(modules, eq(assignments.moduleId, modules.id))
      .where(eq(assignments.classId, classId))
      .orderBy(desc(assignments.assignedAt))

    return { success: true, assignments: classAssignments }
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return { error: 'Failed to fetch assignments', assignments: [] }
  }
}
