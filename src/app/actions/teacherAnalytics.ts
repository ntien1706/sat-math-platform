'use server'

import { db } from '@/lib/db'
import { classes, classEnrollments, profiles, assignments, submissions, submissionAnswers, modules, questions } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, and, desc } from 'drizzle-orm'

export async function getClassProgressOverview(classId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized', overview: [] }
  }

  try {
    // 1. Verify class belongs to teacher
    const targetClass = await db.query.classes.findFirst({
      where: and(eq(classes.id, classId), eq(classes.teacherId, user.id))
    })

    if (!targetClass) return { error: 'Class not found', overview: [] }

    // 2. Get students in class
    const enrolledStudents = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        enrolledAt: classEnrollments.enrolledAt
      })
      .from(classEnrollments)
      .innerJoin(profiles, eq(classEnrollments.studentId, profiles.id))
      .where(eq(classEnrollments.classId, classId))

    // 3. Get all assignments for this class to calculate completion rate
    const classAssignments = await db.query.assignments.findMany({
      where: eq(assignments.classId, classId),
      columns: { id: true, moduleId: true }
    })
    
    const assignmentIds = classAssignments.map(a => a.id)
    const totalAssignments = assignmentIds.length

    // 4. Get submissions and answers to calculate accuracy
    const overview = await Promise.all(enrolledStudents.map(async (student) => {
      
      let completedAssignments = 0
      let totalCorrect = 0
      let totalQuestions = 0

      if (totalAssignments > 0) {
        const studentSubmissions = await db.query.submissions.findMany({
          where: eq(submissions.studentId, student.id)
        })

        // Filter for this class's assignments
        const relevantSubmissions = studentSubmissions.filter(s => assignmentIds.includes(s.assignmentId))
        completedAssignments = relevantSubmissions.length

        if (completedAssignments > 0) {
          const subIds = relevantSubmissions.map(s => s.id)
          // Naive loop for simplicity since we can't easily do `inArray` if it's empty, but we checked > 0
          for (const subId of subIds) {
            const answers = await db.query.submissionAnswers.findMany({
              where: eq(submissionAnswers.submissionId, subId),
              columns: { isCorrect: true }
            })
            totalQuestions += answers.length
            totalCorrect += answers.filter(a => a.isCorrect).length
          }
        }
      }

      const completionRate = totalAssignments === 0 ? 0 : Math.round((completedAssignments / totalAssignments) * 100)
      const accuracy = totalQuestions === 0 ? 0 : Math.round((totalCorrect / totalQuestions) * 100)

      return {
        id: student.id,
        name: student.fullName,
        email: student.email,
        completedAssignments,
        totalAssignments,
        completionRate,
        accuracy
      }
    }))

    return { success: true, overview }
  } catch (error) {
    console.error('Error fetching progress:', error)
    return { error: 'Failed to fetch overview', overview: [] }
  }
}

export async function getStudentDeepDive(studentId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized', logs: [], studentName: '' }
  }

  try {
    const student = await db.query.profiles.findFirst({
      where: eq(profiles.id, studentId)
    })

    if (!student) return { error: 'Student not found', logs: [], studentName: '' }

    // Fetch all submissions for this student, joined with assignments and modules
    const studentSubmissions = await db
      .select({
        submissionId: submissions.id,
        rawScore: submissions.rawScore,
        timeElapsed: submissions.timeElapsed,
        submittedAt: submissions.submittedAt,
        moduleName: modules.title,
        moduleId: modules.id
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(modules, eq(assignments.moduleId, modules.id))
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt))

    return { success: true, logs: studentSubmissions, studentName: student.fullName }
  } catch (error) {
    console.error('Error fetching deep dive:', error)
    return { error: 'Failed to fetch logs', logs: [], studentName: '' }
  }
}

export async function getSubmissionReview(submissionId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized', reviewData: null }
  }

  try {
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId)
    })

    if (!submission) return { error: 'Submission not found', reviewData: null }

    const student = await db.query.profiles.findFirst({
      where: eq(profiles.id, submission.studentId)
    })

    const answersData = await db
      .select({
        questionNumber: questions.questionNumber,
        questionText: questions.questionText,
        imageUrl: questions.imageUrl,
        correctAnswer: questions.correctAnswer,
        questionType: questions.questionType,
        domainTag: questions.domainTag,
        studentAnswer: submissionAnswers.studentAnswer,
        isCorrect: submissionAnswers.isCorrect,
      })
      .from(submissionAnswers)
      .innerJoin(questions, eq(submissionAnswers.questionId, questions.id))
      .where(eq(submissionAnswers.submissionId, submissionId))

    // Sort by question number
    answersData.sort((a, b) => a.questionNumber - b.questionNumber)

    return { 
      success: true, 
      reviewData: {
        studentName: student?.fullName || 'Unknown Student',
        rawScore: submission.rawScore,
        timeElapsed: submission.timeElapsed,
        answers: answersData
      }
    }
  } catch (error) {
    console.error('Error fetching submission review:', error)
    return { error: 'Failed to fetch review', reviewData: null }
  }
}
