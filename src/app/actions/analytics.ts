'use server'

import { db } from '@/lib/db'
import { mistakeBank, questions, submissionAnswers, submissions } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'
import { eq, and, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getStudentMistakes() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'student') {
    return { error: 'Unauthorized', mistakes: [] }
  }

  try {
    const rawMistakes = await db
      .select({
        id: mistakeBank.id,
        studentInput: mistakeBank.studentInput,
        correctAnswer: mistakeBank.correctAnswer,
        isRemembered: mistakeBank.isRemembered,
        addedAt: mistakeBank.addedAt,
        questionId: questions.id,
        questionText: questions.questionText,
        imageUrl: questions.imageUrl,
        domainTag: questions.domainTag,
        questionType: questions.questionType,
        choices: questions.choices,
      })
      .from(mistakeBank)
      .innerJoin(questions, eq(mistakeBank.questionId, questions.id))
      .where(eq(mistakeBank.studentId, user.id))
      .orderBy(desc(mistakeBank.addedAt))

    return { success: true, mistakes: rawMistakes }
  } catch (error) {
    console.error('Error fetching mistakes:', error)
    return { error: 'Failed to fetch mistakes', mistakes: [] }
  }
}

export async function toggleMistakeRemembered(mistakeId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'student') {
    return { error: 'Unauthorized' }
  }

  try {
    // Verify mistake belongs to student
    const mistake = await db.query.mistakeBank.findFirst({
      where: and(
        eq(mistakeBank.id, mistakeId),
        eq(mistakeBank.studentId, user.id)
      )
    })

    if (!mistake) return { error: 'Mistake not found' }

    await db.update(mistakeBank)
      .set({ isRemembered: !currentStatus })
      .where(eq(mistakeBank.id, mistakeId))

    revalidatePath('/student/mistakes')
    revalidatePath('/student/dashboard')
    
    return { success: true }
  } catch (error) {
    console.error('Error toggling mistake:', error)
    return { error: 'Failed to update mistake status' }
  }
}

export async function getStudentDomainStats(targetStudentId?: string) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unauthorized', stats: [] }
  }

  // Determine whose stats to fetch
  let queryStudentId = user.id
  if (targetStudentId) {
    if (user.user_metadata?.role !== 'teacher') {
      return { error: 'Unauthorized', stats: [] }
    }
    queryStudentId = targetStudentId
  } else {
    if (user.user_metadata?.role !== 'student') {
      return { error: 'Unauthorized', stats: [] }
    }
  }

  try {
    // 1. Fetch all submission answers for this student
    const studentAnswers = await db
      .select({
        questionId: submissionAnswers.questionId,
        isCorrect: submissionAnswers.isCorrect,
        domainTag: questions.domainTag,
      })
      .from(submissionAnswers)
      .innerJoin(submissions, eq(submissionAnswers.submissionId, submissions.id))
      .innerJoin(questions, eq(submissionAnswers.questionId, questions.id))
      .where(eq(submissions.studentId, queryStudentId))

    // 2. Fetch student's remembered mistakes
    const rememberedMistakes = await db
      .select({
        questionId: mistakeBank.questionId
      })
      .from(mistakeBank)
      .where(and(
        eq(mistakeBank.studentId, queryStudentId),
        eq(mistakeBank.isRemembered, true)
      ))

    const rememberedSet = new Set(rememberedMistakes.map(m => m.questionId))

    // 3. Aggregate stats per domain
    const domainCounts: Record<string, { total: number, correct: number }> = {
      'Algebra': { total: 0, correct: 0 },
      'Advanced Math': { total: 0, correct: 0 },
      'Problem-Solving': { total: 0, correct: 0 },
      'Geometry/Trig': { total: 0, correct: 0 },
    }

    for (const ans of studentAnswers) {
      const tag = ans.domainTag as string
      if (!domainCounts[tag]) continue // safe guard

      // Smart Filter Constraint: If they missed it, but it's "remembered", skip counting it as an incorrect attempt.
      // Wait, the rule: "exclude from active performance penalty -> do not count that question as an incorrect attempt"
      // Wait, if they got it correct, it doesn't matter. If they got it wrong AND remembered, we skip it entirely?
      // "do not count that question as an "incorrect" attempt" -> which means it is removed from 'total' and 'correct'
      
      if (!ans.isCorrect && rememberedSet.has(ans.questionId)) {
        continue // Exclude this entirely from their stats
      }

      domainCounts[tag].total += 1
      if (ans.isCorrect) {
        domainCounts[tag].correct += 1
      }
    }

    // 4. Format for Recharts (e.g. { subject: 'Algebra', A: 80, fullMark: 100 })
    const stats = Object.keys(domainCounts).map(domain => {
      const { total, correct } = domainCounts[domain]
      const percentage = total === 0 ? 0 : Math.round((correct / total) * 100)
      return {
        subject: domain,
        percentage, // for chart
        correct,    // for tooltips/UI
        total       // for tooltips/UI
      }
    })

    return { success: true, stats }
  } catch (error) {
    console.error('Error calculating domain stats:', error)
    return { error: 'Failed to calculate domain stats', stats: [] }
  }
}
