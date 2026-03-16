import { openai } from '@ai-sdk/openai'

/**
 * Get the appropriate AI model based on the intent source.
 * - Preset intents use gpt-4o-mini (cheaper, structured task)
 * - Freetext intents use gpt-4o (more reasoning needed)
 *
 * API key is read from OPENAI_API_KEY env var automatically by @ai-sdk/openai.
 */
export function getModel(source: 'preset' | 'freetext') {
  if (source === 'preset') {
    return openai('gpt-4o-mini')
  }
  return openai('gpt-4o')
}
