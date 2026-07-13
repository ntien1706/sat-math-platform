'use server'

import { db } from '@/lib/db'
import { profiles, classes, classEnrollments } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function addStudentByEmail(classId: string, email: string) {
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

    // Lookup student by email
    const student = await db.query.profiles.findFirst({
      where: eq(profiles.email, email.toLowerCase()),
    })

    if (!student) {
      return { error: 'No user found with that email address' }
    }

    if (student.role !== 'student') {
      return { error: 'User is not a student' }
    }

    // Check if already enrolled
    const existingEnrollment = await db.query.classEnrollments.findFirst({
      where: and(
        eq(classEnrollments.classId, classId),
        eq(classEnrollments.studentId, student.id)
      ),
    })

    if (existingEnrollment) {
      return { error: 'Student is already enrolled in this class' }
    }

    // Insert enrollment
    await db.insert(classEnrollments).values({
      classId,
      studentId: student.id,
    })

    revalidatePath(`/teacher/classes/${classId}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding student:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getClassRoster(classId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized', roster: [] }
  }

  try {
    // Verify teacher owns the class
    const targetClass = await db.query.classes.findFirst({
      where: and(eq(classes.id, classId), eq(classes.teacherId, user.id)),
    })

    if (!targetClass) {
      return { error: 'Class not found', roster: [] }
    }

    // Fetch roster using join
    const roster = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        enrolledAt: classEnrollments.enrolledAt,
      })
      .from(classEnrollments)
      .innerJoin(profiles, eq(classEnrollments.studentId, profiles.id))
      .where(eq(classEnrollments.classId, classId))

    return { success: true, roster, className: targetClass.name }
  } catch (error) {
    console.error('Error fetching roster:', error)
    return { error: 'Failed to fetch roster', roster: [] }
  }
}

export async function getStudentEnrollments() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'student') {
    return { error: 'Unauthorized', enrollments: [] }
  }

  try {
    const enrollments = await db
      .select({
        id: classes.id,
        name: classes.name,
        teacherName: profiles.fullName,
        enrolledAt: classEnrollments.enrolledAt,
      })
      .from(classEnrollments)
      .innerJoin(classes, eq(classEnrollments.classId, classes.id))
      .innerJoin(profiles, eq(classes.teacherId, profiles.id))
      .where(eq(classEnrollments.studentId, user.id))

    return { success: true, enrollments }
  } catch (error) {
    console.error('Error fetching student enrollments:', error)
    return { error: 'Failed to fetch enrolled classes', enrollments: [] }
  }
}
