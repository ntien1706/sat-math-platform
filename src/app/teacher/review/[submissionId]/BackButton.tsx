'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
    >
      &larr; Back to Profile
    </button>
  )
}
