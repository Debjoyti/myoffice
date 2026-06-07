/**
 * Minimal Anthropic (Claude) API client.
 * Third-party AI calls live here per the integrations registry pattern —
 * never call the provider directly from API routes or services.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-4-5'

type Message = { role: 'user' | 'assistant'; content: string }

export class AnthropicClient {
  private apiKey: string

  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
    this.apiKey = apiKey
  }

  /** Send a single-turn prompt and return the raw text response. */
  async complete(prompt: string, opts: { system?: string; maxTokens?: number; model?: string } = {}): Promise<string> {
    const messages: Message[] = [{ role: 'user', content: prompt }]
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        max_tokens: opts.maxTokens ?? 4096,
        system: opts.system,
        messages,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Anthropic API error (${res.status}): ${text}`)
    }

    const data = await res.json()
    return (data.content ?? []).map((b: any) => b.text ?? '').join('')
  }

  /** Send a prompt and parse the response as JSON (strips ```json fences if present). */
  async completeJSON<T = any>(prompt: string, opts: { system?: string; maxTokens?: number; model?: string } = {}): Promise<T> {
    const raw = await this.complete(prompt, opts)
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    return JSON.parse(cleaned) as T
  }
}

let _client: AnthropicClient | null = null
export function getAnthropicClient(): AnthropicClient {
  if (!_client) _client = new AnthropicClient()
  return _client
}
