'use server'

import { db } from '@/lib/db'
import { assignments, modules, classes, classEnrollments, profiles, questions, submissions, submissionAnswers, mistakeBank } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, and, isNull, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getPendingAssignments() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'student') {
    return { error: 'Unauthorized', pendingAssignments: [] }
  }

  try {
    // We need to find assignments where:
    // 1. Student is enrolled in the class
    // 2. There is NO submission record for this student and assignment
    
    // Subquery-like approach using joins and filtering where submission is null
    const enrolledClasses = await db.query.classEnrollments.findMany({
      where: eq(classEnrollments.studentId, user.id),
      columns: { classId: true }
    })
    
    if (enrolledClasses.length === 0) {
      return { success: true, pendingAssignments: [] }
    }
    
    const classIds = enrolledClasses.map(c => c.classId)
    
    // Fetch assignments for those classes
    const allAssignments = await db
      .select({
        id: assignments.id,
        moduleName: modules.title,
        className: classes.name,
        teacherName: profiles.fullName,
        assignedAt: assignments.assignedAt,
        dueDate: assignments.dueDate,
      })
      .from(assignments)
      .innerJoin(modules, eq(assignments.moduleId, modules.id))
      .innerJoin(classes, eq(assignments.classId, classes.id))
      .innerJoin(profiles, eq(classes.teacherId, profiles.id))
      .where(inArray(assignments.classId, classIds))

    // Now fetch submissions by this student
    const studentSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.studentId, user.id),
      columns: { assignmentId: true }
    })
    
    const submittedAssignmentIds = new Set(studentSubmissions.map(s => s.assignmentId))
    
    // Filter out submitted ones
    const pendingAssignments = allAssignments.filter(a => !submittedAssignmentIds.has(a.id))

    return { success: true, pendingAssignments }
  } catch (error) {
    console.error('Error fetching pending assignments:', error)
    return { error: 'Failed to fetch pending assignments', pendingAssignments: [] }
  }
}

export async function getTestModuleData(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'student') {
    return { error: 'Unauthorized', moduleData: null }
  }

  try {
    // Verify assignment exists and student is enrolled in its class
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
      with: {
        class: true,
      }
    })

    if (!assignment) {
      return { error: 'Assignment not found', moduleData: null }
    }

    const enrollment = await db.query.classEnrollments.findFirst({
      where: and(
        eq(classEnrollments.classId, assignment.classId),
        eq(classEnrollments.studentId, user.id)
      )
    })

    if (!enrollment) {
      return { error: 'You are not enrolled in the class for this assignment', moduleData: null }
    }

    // Verify student hasn't submitted already
    const existingSubmission = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.studentId, user.id)
      )
    })

    if (existingSubmission) {
      return { error: 'You have already submitted this assignment', moduleData: null }
    }

    // Fetch the module and questions
    const module = await db.query.modules.findFirst({
      where: eq(modules.id, assignment.moduleId)
    })

    const moduleQuestions = await db.query.questions.findMany({
      where: eq(questions.moduleId, assignment.moduleId),
      orderBy: (questions, { asc }) => [asc(questions.questionNumber)]
    })

    // Remove correct_answer before sending to client!
    const secureQuestions = moduleQuestions.map(({ correctAnswer, ...q }) => q)

    return { 
      success: true, 
      moduleData: {
        id: module?.id,
        title: module?.title,
        questions: secureQuestions
      }
    }

  } catch (error) {
    console.error('Error fetching test data:', error)
    return { error: 'Failed to fetch test data', moduleData: null }
  }
}

type AnswerInput = {
  questionId: string
  studentAnswer: string | null
}

function normalizeMathString(str: string) {
  return str.replace(/\s+/g, '').toLowerCase()
}

function parseFractionOrFloat(str: string) {
  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length === 2) {
      const num = parseFloat(parts[0])
      const den = parseFloat(parts[1])
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den
      }
    }
  }
  return parseFloat(str)
}

export async function submitTest(assignmentId: string, answersArray: AnswerInput[], timeElapsed: number) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  try {
    // 1. Verify assignment and enrollment
    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId)
    })

    if (!assignment) return { error: 'Assignment not found' }

    // 2. Prevent duplicate submission
    const existingSubmission = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.assignmentId, assignmentId),
        eq(submissions.studentId, user.id)
      )
    })

    if (existingSubmission) return { error: 'Test already submitted' }

    // 3. Fetch all true answers for this module to grade on the server
    const moduleQuestions = await db.query.questions.findMany({
      where: eq(questions.moduleId, assignment.moduleId)
    })

    // Map questions by ID for quick lookup
    const qMap = new Map()
    for (const q of moduleQuestions) {
      qMap.set(q.id, q)
    }

    let rawScore = 0
    const submissionAnswersToInsert = []

    // Grade each answer
    for (const answer of answersArray) {
      const q = qMap.get(answer.questionId)
      if (!q) continue // Or error out

      let isCorrect = false
      const sAns = answer.studentAnswer

      if (sAns !== null && sAns.trim() !== '') {
        const correctAns = q.correctAnswer

        if (q.questionType === 'MCQ') {
          // Exact string match (A, B, C, D)
          isCorrect = sAns.trim().toUpperCase() === correctAns.trim().toUpperCase()
        } else if (q.questionType === 'SPR') {
          // Math Validation Engine
          const sNormalized = normalizeMathString(sAns)
          const cNormalized = normalizeMathString(correctAns)

          if (sNormalized === cNormalized) {
            isCorrect = true
          } else {
            // Floating-Point Shield
            const sFloat = parseFractionOrFloat(sNormalized)
            const cFloat = parseFractionOrFloat(cNormalized)

            if (!isNaN(sFloat) && !isNaN(cFloat)) {
              if (Math.abs(sFloat - cFloat) <= 0.001) {
                isCorrect = true
              }
            }
          }
        }
      }

      if (isCorrect) rawScore += 1

      submissionAnswersToInsert.push({
        questionId: q.id,
        studentAnswer: sAns,
        isCorrect
      })
    }

    // Use a transaction
    await db.transaction(async (tx) => {
      // Create submission
      const [newSubmission] = await tx.insert(submissions).values({
        assignmentId,
        studentId: user.id,
        rawScore,
        timeElapsed,
      }).returning({ id: submissions.id })

      // Insert answers
      const answersWithSubId = submissionAnswersToInsert.map(a => ({
        submissionId: newSubmission.id,
        questionId: a.questionId,
        studentAnswer: a.studentAnswer,
        isCorrect: a.isCorrect
      }))

      await tx.insert(submissionAnswers).values(answersWithSubId)

      // Sync mistake bank
      const mistakesToInsert = submissionAnswersToInsert
        .filter(a => !a.isCorrect)
        .map(a => {
          const q = qMap.get(a.questionId)
          return {
            studentId: user.id,
            questionId: a.questionId,
            studentInput: a.studentAnswer,
            correctAnswer: q.correctAnswer
          }
        })

      if (mistakesToInsert.length > 0) {
        // Use onConflictDoUpdate to prevent duplicates but update the latest incorrect answer
        await tx.insert(mistakeBank)
          .values(mistakesToInsert)
          .onConflictDoUpdate({
            target: [mistakeBank.studentId, mistakeBank.questionId],
            set: {
              studentInput: sql`EXCLUDED.student_input`,
              isRemembered: false, // Reset to not remembered if they miss it again
              addedAt: sql`NOW()`,
            }
          })
      }
    })

    revalidatePath('/student/dashboard')
    revalidatePath('/student/mistakes')
    return { success: true }
  } catch (error) {
    console.error('Error submitting test:', error)
    return { error: 'Failed to submit test' }
  }
}
