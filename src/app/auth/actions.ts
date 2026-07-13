'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['teacher', 'student']),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export async function login(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = loginSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Invalid form data', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/') // Middleware will redirect to correct dashboard based on role
}

export async function signup(formData: FormData) {
  const data = Object.fromEntries(formData.entries())
  const parsed = registerSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Invalid form data', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
