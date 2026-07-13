import { pgTable, pgEnum, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['teacher', 'student'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // references auth.users(id)
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const classEnrollments = pgTable('class_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unq: unique().on(t.classId, t.studentId)
}))
