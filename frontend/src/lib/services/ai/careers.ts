/**
 * AI features for the Career Portal (CLAUDE.md rule #10 — AI is just another
 * integration). Each function calls Claude through the Anthropic integration
 * client and ALWAYS degrades to the deterministic logic in
 * `@/lib/services/careers` when no API key is configured or the call fails.
 *
 * This keeps the portal a working model out-of-the-box: no key → heuristic
 * scoring; key present → richer LLM evaluation. Same shape either way.
 */

import { getAnthropicClient } from '@/lib/integrations/anthropic/client'
import {
  buildFallbackInterview, scoreInterviewFallback, computeMatch,
  type InterviewQuestion, type InterviewEvaluation, type MatchResult,
  DEFAULT_COMPETENCIES,
} from '@/lib/services/careers'

const hasKey = () => !!process.env.ANTHROPIC_API_KEY

type Job = {
  title: string
  description?: string | null
  requirements?: unknown
  skills?: unknown
  ai_competencies?: unknown
  ai_question_count?: number | null
  experience_level?: string | null
}

/* ─── 1. Generate a structured interview from a job ──────────────────────── */

export async function generateInterview(job: Job): Promise<InterviewQuestion[]> {
  const competencies = Array.isArray(job.ai_competencies) && job.ai_competencies.length
    ? (job.ai_competencies as string[])
    : [...DEFAULT_COMPETENCIES]
  const count = Math.max(3, Math.min(Number(job.ai_question_count ?? 5), 8))
  const fallback = () => buildFallbackInterview({ competencies, count, jobTitle: job.title })

  if (!hasKey()) return fallback()

  try {
    const client = getAnthropicClient()
    const skills = Array.isArray(job.skills) ? job.skills.join(', ') : ''
    const prompt = `You are an I/O psychologist designing a structured, competency-based async video interview.
Role: ${job.title} (${job.experience_level ?? 'mid'} level)
Key skills: ${skills || 'general'}
Competencies to assess: ${competencies.join(', ')}
Job description: ${(job.description ?? '').slice(0, 1500)}

Write exactly ${count} behavioural questions that elicit STAR answers. Bias toward job-relevant scenarios.
Return ONLY JSON: an array of {"competency": "<one of: ${competencies.join('|')}>", "prompt": "<question>"}.`
    const arr = await client.completeJSON<Array<{ competency: string; prompt: string }>>(prompt, {
      system: 'You output only valid JSON. No prose.', maxTokens: 1500,
    })
    if (!Array.isArray(arr) || !arr.length) return fallback()
    return arr.slice(0, count).map((q, i) => ({
      id: `q${i + 1}`,
      competency: competencies.includes(q.competency) ? q.competency : competencies[i % competencies.length],
      prompt: String(q.prompt),
      prep_seconds: 30,
      answer_seconds: 150,
    }))
  } catch (err) {
    console.error('[ai/careers] generateInterview fell back:', (err as Error).message)
    return fallback()
  }
}

/* ─── 2. Score a completed interview ─────────────────────────────────────── */

export async function evaluateInterview(
  questions: InterviewQuestion[],
  responses: Array<{ question_id: string; answer: string; duration_seconds?: number }>,
  job?: Job,
): Promise<InterviewEvaluation> {
  const fallback = () => scoreInterviewFallback(questions, responses)
  if (!hasKey()) return fallback()

  try {
    const client = getAnthropicClient()
    const transcript = questions.map(q => {
      const r = responses.find(x => x.question_id === q.id)
      return `Q (${q.competency}): ${q.prompt}\nA: ${r?.answer?.trim() || '[no answer]'}`
    }).join('\n\n')

    const prompt = `You are an expert interview assessor scoring a structured async interview for the role of "${job?.title ?? 'the role'}".
Score the CONTENT of answers (HireVue-style — words matter, not looks). Use STAR (Situation, Task, Action, Result) as the structure rubric.

Transcript:
${transcript}

Return ONLY JSON matching this shape:
{
 "scores": {"relevancy": <0-100>, "communication": <0-100>, "structure": <0-100>, "role_expertise": <0-100>,
   "per_question": [{"question_id":"q1","competency":"...","relevancy":0,"structure":0,"communication":0,"score":0,"notes":"..."}]},
 "overall_score": <0-100>,
 "recommendation": "strong_yes|yes|maybe|no",
 "strengths": ["..."],
 "concerns": ["..."],
 "summary": "<2-3 sentences>",
 "integrity_flags": []
}
Be fair and calibrated; unanswered questions should lower the overall score.`
    const out = await client.completeJSON<InterviewEvaluation>(prompt, {
      system: 'You output only valid JSON. No prose.', maxTokens: 2500,
    })
    // sanity: require core fields, else fall back
    if (!out || typeof out.overall_score !== 'number' || !out.scores) return fallback()
    return out
  } catch (err) {
    console.error('[ai/careers] evaluateInterview fell back:', (err as Error).message)
    return fallback()
  }
}

/* ─── 3. Screen / match a candidate against a job ────────────────────────── */

export type ScreenResult = MatchResult & { summary?: string }

export async function screenCandidate(job: {
  skills?: unknown; min_experience?: number | null; max_experience?: number | null
  work_mode?: string | null; location?: string | null; title?: string
}, candidate: {
  skills?: unknown; experience_years?: number | null; open_to_remote?: boolean | null
  location?: string | null; summary?: string | null; headline?: string | null
}): Promise<ScreenResult> {
  const base = computeMatch({
    jobSkills: job.skills,
    candidateSkills: candidate.skills,
    jobMinExp: job.min_experience,
    jobMaxExp: job.max_experience,
    candidateExp: candidate.experience_years,
    jobWorkMode: job.work_mode,
    candidateOpenToRemote: candidate.open_to_remote,
    jobLocation: job.location,
    candidateLocation: candidate.location,
  })
  if (!hasKey()) return base

  try {
    const client = getAnthropicClient()
    const prompt = `Rate this candidate's fit for the role "${job.title ?? ''}" from 0-100 and explain briefly.
Required skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : ''}
Candidate: ${candidate.headline ?? ''} — ${candidate.experience_years ?? 0}y exp. Skills: ${Array.isArray(candidate.skills) ? candidate.skills.join(', ') : ''}. ${(candidate.summary ?? '').slice(0, 500)}
Return ONLY JSON: {"score": <0-100>, "reasons": ["...","..."], "summary": "<1 sentence>"}.`
    const out = await client.completeJSON<{ score: number; reasons: string[]; summary: string }>(prompt, {
      system: 'You output only valid JSON. No prose.', maxTokens: 600,
    })
    if (out && typeof out.score === 'number') {
      // Blend LLM judgment with the deterministic floor (avoids hallucinated extremes).
      const blended = Math.round(out.score * 0.6 + base.score * 0.4)
      return { ...base, score: Math.min(100, blended), reasons: out.reasons?.length ? out.reasons : base.reasons, summary: out.summary }
    }
    return base
  } catch (err) {
    console.error('[ai/careers] screenCandidate fell back:', (err as Error).message)
    return base
  }
}
