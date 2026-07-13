import { pgTable, pgEnum, uuid, text, timestamp, unique, integer, jsonb, boolean } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['teacher', 'student'])
export const questionTypeEnum = pgEnum('question_type', ['MCQ', 'SPR'])
export const domainTagEnum = pgEnum('domain_tag', ['Algebra', 'Advanced Math', 'Problem-Solving', 'Geometry/Trig'])

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

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  createdBy: uuid('created_by').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  questionNumber: integer('question_number').notNull(),
  questionText: text('question_text').notNull(),
  imageUrl: text('image_url'),
  questionType: questionTypeEnum('question_type').notNull(),
  domainTag: domainTagEnum('domain_tag').notNull(),
  choices: jsonb('choices'),
  correctAnswer: text('correct_answer').notNull(),
}, (t) => ({
  unq: unique().on(t.moduleId, t.questionNumber)
}))

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }),
}, (t) => ({
  unq: unique().on(t.classId, t.moduleId)
}))

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  assignmentId: uuid('assignment_id').notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  rawScore: integer('raw_score').notNull(),
  timeElapsed: integer('time_elapsed').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unq: unique().on(t.assignmentId, t.studentId)
}))

export const submissionAnswers = pgTable('submission_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  studentAnswer: text('student_answer'),
  isCorrect: boolean('is_correct').notNull(),
}, (t) => ({
  unq: unique().on(t.submissionId, t.questionId)
}))
