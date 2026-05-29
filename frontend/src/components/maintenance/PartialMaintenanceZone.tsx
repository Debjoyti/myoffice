'use client'

interface Props {
  featureName: string
  eta?: string | null
  alternateLabel?: string
  alternateHref?: string
  onRetry?: () => void
}

function formatETA(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function PartialMaintenanceZone({
  featureName,
  eta,
  alternateLabel,
  alternateHref,
  onRetry,
}: Props) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl" aria-hidden="true">🔧</span>
        <div>
          <h3 className="text-lg font-semibold text-blue-900">{featureName} is under maintenance</h3>
          <p className="text-blue-700 text-sm mt-1">
            You can still use the rest of the site. This feature will return shortly.
          </p>
        </div>
      </div>

      {eta && (
        <p className="text-blue-800 text-sm mb-4">
          <strong>Expected back:</strong> {formatETA(eta)}
        </p>
      )}

      <div className="flex gap-3 flex-wrap">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        )}
        {alternateHref && (
          <a
            href={alternateHref}
            className="px-4 py-2 border border-blue-300 text-blue-800 text-sm font-medium rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {alternateLabel ?? 'Use Alternative'}
          </a>
        )}
      </div>
    </div>
  )
}
