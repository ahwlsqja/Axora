'use client'

import { useMutation } from '@tanstack/react-query'
import { useStrategyStore } from '@/stores/strategyStore'
import type {
  StrategyGenerationRequest,
  StrategyGenerationResponse,
} from '@/lib/strategy/types'

async function generateStrategy(
  request: StrategyGenerationRequest
): Promise<StrategyGenerationResponse> {
  const res = await fetch('/api/strategy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      (data as { error?: string }).error ?? 'Failed to generate strategy'
    )
  }

  return res.json() as Promise<StrategyGenerationResponse>
}

export function useStrategy() {
  const { setProposal, setGenerating, setError, reset } = useStrategyStore()

  const mutation = useMutation({
    mutationFn: generateStrategy,
    onMutate: () => {
      setGenerating()
    },
    onSuccess: (data) => {
      setProposal(data.proposal, data.validation, data.market)
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  return {
    generate: mutation.mutate,
    isGenerating: mutation.isPending,
    error: mutation.error,
    reset,
  }
}
