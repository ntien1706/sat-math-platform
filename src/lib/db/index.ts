import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let connectionString = process.env.DATABASE_URL || ''

// Fix for unencoded passwords in connection string
const match = connectionString.match(/^(postgresql:\/\/[^:]+:)(.*)(@.*)$/)
if (match) {
  const password = match[2]
  // Only encode if we see unencoded characters that break URL parsing
  if (password.includes('/') || password.includes(',')) {
    connectionString = match[1] + encodeURIComponent(password) + match[3]
  }
}

// Fallback to a dummy connection string during Vercel build if DATABASE_URL is missing
const safeConnectionString = connectionString || 'postgresql://postgres:pass@localhost:5432/postgres'

// Singleton pattern for Next.js hot reloading to prevent connection leaks
declare global {
  // eslint-disable-next-line no-var
  var postgresClient: ReturnType<typeof postgres> | undefined
}

const client = globalThis.postgresClient ?? postgres(safeConnectionString, { prepare: false })
if (process.env.NODE_ENV !== 'production') {
  globalThis.postgresClient = client
}

export const db = drizzle(client, { schema })
