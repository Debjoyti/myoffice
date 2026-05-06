'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="text-gray-600 max-w-md">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
