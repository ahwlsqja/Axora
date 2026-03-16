'use client'

interface RiskWarningProps {
  warnings: string[]
  errors: string[]
}

export function RiskWarning({ warnings, errors }: RiskWarningProps) {
  if (warnings.length === 0 && errors.length === 0) return null

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-semibold text-red-800">
            전략 거부됨 <span className="font-normal text-red-600">Strategy Rejected</span>
          </p>
          <ul className="mt-2 space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm font-semibold text-amber-800">
            주의사항 <span className="font-normal text-amber-600">Warnings</span>
          </p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warn, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
