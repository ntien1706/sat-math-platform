import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['teacher', 'student'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // references auth.users(id)
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
