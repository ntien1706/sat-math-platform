'use server'

import { db } from '@/lib/db'
import { modules, questions } from '@/lib/db/schema'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const questionSchema = z.object({
  questionNumber: z.number().min(1).max(27),
  questionText: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  questionType: z.enum(['MCQ', 'SPR']),
  domainTag: z.enum(['Algebra', 'Advanced Math', 'Problem-Solving', 'Geometry/Trig']),
  choices: z.record(z.string(), z.string()).nullable().optional(),
  correctAnswer: z.string().min(1),
})

const createModuleSchema = z.object({
  title: z.string().min(1),
  questions: z.array(questionSchema).length(27),
})

type CreateModuleInput = z.infer<typeof createModuleSchema>

export async function createModuleWithQuestions(data: CreateModuleInput) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' }
  }

  const parsed = createModuleSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Invalid module data: ' + (parsed.error.issues[0]?.message || 'Unknown error') }
  }

  try {
    // Perform transaction
    const newModuleId = await db.transaction(async (tx) => {
      // 1. Create module
      const [newModule] = await tx.insert(modules).values({
        title: parsed.data.title,
        createdBy: user.id,
      }).returning({ id: modules.id })

      // 2. Map and insert questions
      const questionsToInsert = parsed.data.questions.map((q) => ({
        moduleId: newModule.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        imageUrl: q.imageUrl || null,
        questionType: q.questionType,
        domainTag: q.domainTag,
        choices: q.choices || null,
        correctAnswer: q.correctAnswer,
      }))

      await tx.insert(questions).values(questionsToInsert)

      return newModule.id
    })

    revalidatePath('/teacher/dashboard')
    return { success: true, moduleId: newModuleId }
  } catch (error) {
    console.error('Error creating module:', error)
    return { error: 'Failed to create module.' }
  }
}

export async function uploadQuestionImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user || user.user_metadata?.role !== 'teacher') {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'No file provided' }
  }

  // Generate a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `questions/${fileName}`

  // Upload to Supabase Storage bucket 'module-images'
  const { error: uploadError } = await supabase.storage
    .from('module-images')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Failed to upload image. Make sure the "module-images" bucket exists and is public.' }
  }

  const { data } = supabase.storage.from('module-images').getPublicUrl(filePath)
  return { success: true, url: data.publicUrl }
}
