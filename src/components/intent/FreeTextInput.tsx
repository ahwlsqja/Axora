'use client'

interface FreeTextInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function FreeTextInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: FreeTextInputProps) {
  const canSubmit = value.trim().length > 0

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSubmit) {
      onSubmit()
    }
  }

  return (
    <div
      className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="무엇을 하고 싶으세요? (예: INJ가 떨어지면 분할매수)"
        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 pr-20 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        disabled={disabled}
      />
      {canSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          확인
        </button>
      )}
    </div>
  )
}
