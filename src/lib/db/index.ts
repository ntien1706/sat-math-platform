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

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(safeConnectionString, { prepare: false })
export const db = drizzle(client, { schema })
