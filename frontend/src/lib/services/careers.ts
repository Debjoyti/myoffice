/**
 * Career Portal service layer — pure, testable business logic shared by the
 * career API routes (CLAUDE.md rule #5). No DB or network here.
 *
 * Covers the deterministic spine of the hiring funnel:
 *   - candidate↔job match scoring (skills overlap + experience + location fit)
 *   - profile completeness score (drives "complete your profile" nudges)
 *   - the STAR-aware interview rubric used as a fallback when no LLM key
 *   - pipeline stage machine + funnel helpers
 *   - salary / experience formatting for the storefront
 */

/* ─── Domain vocabulary ─────────────────────────────────────────────────── */

export const PIPELINE_STAGES = [
  'applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn',
] as const
export type Stage = (typeof PIPELINE_STAGES)[number]

/** The forward funnel (excludes terminal rejected/withdrawn). */
export const ACTIVE_STAGES: Stage[] = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired']

export const STAGE_LABEL: Record<Stage, string> = {
  applied: 'Applied', screening: 'Screening', interview: 'Interview',
  assessment: 'Assessment', offer: 'Offer', hired: 'Hired',
  rejected: 'Rejected', withdrawn: 'Withdrawn',
}

/** Allowed forward/back transitions in the ATS board. Reject/withdraw allowed from any active stage. */
export const STAGE_TRANSITIONS: Record<Stage, Stage[]> = {
  applied:    ['screening', 'interview', 'rejected'],
  screening:  ['interview', 'assessment', 'rejected'],
  interview:  ['assessment', 'offer', 'rejected'],
  assessment: ['interview', 'offer', 'rejected'],
  offer:      ['hired', 'rejected'],
  hired:      [],
  rejected:   ['applied'],   // allow re-open
  withdrawn:  ['applied'],
}

export function canMoveStage(from: Stage, to: Stage): boolean {
  if (from === to) return false
  if (to === 'withdrawn' && from !== 'hired') return true
  return (STAGE_TRANSITIONS[from] ?? []).includes(to)
}

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'temporary'] as const
export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const
export const EXPERIENCE_LEVELS = ['intern', 'junior', 'mid', 'senior', 'lead', 'director'] as const

/** Default competencies scored by the AI interview, mirroring HireVue rubrics. */
export const DEFAULT_COMPETENCIES = [
  'communication', 'problem_solving', 'teamwork', 'ownership', 'role_expertise',
] as const

/* ─── Text helpers ──────────────────────────────────────────────────────── */

export function slugify(input: string): string {
  return (input || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 70) || `job-${Date.now()}`
}

/** Normalise a skill token for fuzzy comparison ("Node.js" → "nodejs"). */
function normSkill(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9+#]/g, '')
}

function toSkillArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return v.split(/[,;]/).map(s => s.trim()).filter(Boolean)
  return []
}

/* ─── Match scoring (candidate ↔ job) ───────────────────────────────────── */

export type MatchInput = {
  jobSkills: unknown
  candidateSkills: unknown
  jobMinExp?: number | null
  jobMaxExp?: number | null
  candidateExp?: number | null
  jobWorkMode?: string | null
  candidateOpenToRemote?: boolean | null
  jobLocation?: string | null
  candidateLocation?: string | null
}

export type MatchResult = {
  score: number            // 0-100
  skillScore: number
  expScore: number
  locationScore: number
  matchedSkills: string[]
  missingSkills: string[]
  reasons: string[]
}

/**
 * Deterministic candidate↔job fit. Weighted: skills 60, experience 25, location 15.
 * Used directly for instant scoring and as the floor when the LLM is unavailable.
 */
export function computeMatch(input: MatchInput): MatchResult {
  const jobSkills = toSkillArray(input.jobSkills)
  const candSkills = toSkillArray(input.candidateSkills)
  const candSet = new Set(candSkills.map(normSkill))

  const matched: string[] = []
  const missing: string[] = []
  for (const js of jobSkills) {
    if (candSet.has(normSkill(js))) matched.push(js)
    else missing.push(js)
  }
  const skillRatio = jobSkills.length ? matched.length / jobSkills.length : (candSkills.length ? 0.5 : 0)
  const skillScore = Math.round(skillRatio * 60)

  // Experience: full marks inside [min,max], graceful decay outside.
  const min = Number(input.jobMinExp ?? 0)
  const max = input.jobMaxExp != null ? Number(input.jobMaxExp) : min + 4
  const exp = Number(input.candidateExp ?? 0)
  let expRatio: number
  if (exp >= min && exp <= max) expRatio = 1
  else if (exp < min) expRatio = min > 0 ? Math.max(0, exp / min) : 1
  else expRatio = Math.max(0.55, 1 - (exp - max) / 10) // overqualified, mild penalty
  const expScore = Math.round(expRatio * 25)

  // Location / remote fit.
  let locRatio = 0.6
  const mode = (input.jobWorkMode ?? '').toLowerCase()
  if (mode === 'remote') locRatio = 1
  else if (input.candidateOpenToRemote && mode === 'hybrid') locRatio = 0.9
  else if (input.jobLocation && input.candidateLocation) {
    const j = input.jobLocation.toLowerCase()
    const c = input.candidateLocation.toLowerCase()
    locRatio = j.split(',')[0].trim() && c.includes(j.split(',')[0].trim()) ? 1 : 0.5
  }
  const locationScore = Math.round(locRatio * 15)

  const score = Math.min(100, skillScore + expScore + locationScore)

  const reasons: string[] = []
  if (matched.length) reasons.push(`Matches ${matched.length}/${jobSkills.length} required skills (${matched.slice(0, 5).join(', ')})`)
  if (missing.length) reasons.push(`Gaps: ${missing.slice(0, 4).join(', ')}`)
  if (exp >= min && exp <= max) reasons.push(`Experience (${exp}y) fits the ${min}–${max}y band`)
  else if (exp < min) reasons.push(`Below the ${min}y minimum (${exp}y)`)
  else reasons.push(`Above target band (${exp}y vs ${max}y) — possibly overqualified`)
  if (mode === 'remote' || (input.candidateOpenToRemote && mode === 'hybrid')) reasons.push('Location/remote preferences align')

  return { score, skillScore, expScore, locationScore, matchedSkills: matched, missingSkills: missing, reasons }
}

/* ─── Profile completeness ──────────────────────────────────────────────── */

/** 0-100 score that rewards a recruiter-ready profile (drives nudges, search rank). */
export function profileScore(c: Record<string, any>): number {
  const checks: Array<[boolean, number]> = [
    [!!c.full_name, 8],
    [!!c.email, 8],
    [!!c.phone, 6],
    [!!c.headline, 10],
    [!!c.summary && String(c.summary).length > 60, 12],
    [toSkillArray(c.skills).length >= 3, 16],
    [Number(c.experience_years) > 0, 8],
    [!!c.current_company, 6],
    [!!c.resume_url, 12],
    [!!c.linkedin_url || !!c.github_url || !!c.portfolio_url, 6],
    [Array.isArray(c.experience) && c.experience.length > 0, 4],
    [Array.isArray(c.education) && c.education.length > 0, 4],
  ]
  return Math.min(100, checks.reduce((sum, [ok, w]) => sum + (ok ? w : 0), 0))
}

/* ─── Interview generation (deterministic fallback) ─────────────────────── */

export type InterviewQuestion = {
  id: string
  competency: string
  prompt: string
  prep_seconds: number
  answer_seconds: number
}

const QUESTION_BANK: Record<string, string[]> = {
  communication: [
    'Tell us about yourself and why this role is the right next step for you.',
    'Describe a time you had to explain something complex to a non-technical stakeholder. How did you do it?',
  ],
  problem_solving: [
    'Walk us through the most challenging problem you solved recently — situation, what you tried, and the result.',
    'Tell us about a time you had to make a decision with incomplete information.',
  ],
  teamwork: [
    'Describe a conflict you had with a teammate and how you resolved it.',
    'Tell us about a time you helped a struggling teammate or improved how your team worked.',
  ],
  ownership: [
    'Tell us about a project you owned end-to-end. What was the outcome and what would you do differently?',
    'Describe a time something went wrong on your watch. How did you respond?',
  ],
  role_expertise: [
    'What part of this role are you strongest in, and can you give a concrete example that proves it?',
    'Tell us about a result you are proud of that is directly relevant to this position.',
  ],
}

/** Build an interview from a job's competencies. Used when no LLM key is set. */
export function buildFallbackInterview(opts: {
  competencies?: string[]
  count?: number
  jobTitle?: string
}): InterviewQuestion[] {
  const comps = (opts.competencies?.length ? opts.competencies : [...DEFAULT_COMPETENCIES])
    .filter(c => QUESTION_BANK[c])
  const count = Math.max(3, Math.min(opts.count ?? 5, 8))
  const out: InterviewQuestion[] = []
  let i = 0
  while (out.length < count) {
    const comp = comps[i % comps.length] || 'role_expertise'
    const bank = QUESTION_BANK[comp]
    const prompt = bank[Math.floor(i / comps.length) % bank.length]
    out.push({
      id: `q${out.length + 1}`,
      competency: comp,
      prompt: out.length === 0 && opts.jobTitle
        ? `For the ${opts.jobTitle} role: ${prompt}`
        : prompt,
      prep_seconds: 30,
      answer_seconds: 150,
    })
    i++
  }
  return out
}

/* ─── Interview scoring (deterministic fallback) ────────────────────────── */

const STAR_SIGNALS = {
  situation: /\b(situation|context|when i|at my|during|the project|the team|we were|i was working)\b/i,
  task: /\b(task|goal|objective|responsible|needed to|had to|my job|asked to|challenge was)\b/i,
  action: /\b(i (built|led|designed|implemented|created|decided|organized|analyzed|coded|wrote|drove|negotiated|coordinated))\b/i,
  result: /\b(result|outcome|increased|reduced|improved|delivered|achieved|grew|saved|by \d|%|impact|shipped)\b/i,
}

export type ScoredResponse = {
  question_id: string
  competency: string
  relevancy: number       // 0-100
  structure: number       // STAR coverage 0-100
  communication: number   // 0-100
  score: number           // 0-100 blended
  notes: string
}

export type InterviewEvaluation = {
  scores: {
    relevancy: number
    communication: number
    structure: number
    role_expertise: number
    per_question: ScoredResponse[]
  }
  overall_score: number
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no'
  strengths: string[]
  concerns: string[]
  summary: string
  integrity_flags: string[]
}

/**
 * Score an interview transcript without an LLM. Rewards STAR structure, on-topic
 * keyword overlap with the question, and clear, appropriately-detailed answers.
 * Deliberately conservative so AI-scored ≈ human ballpark.
 */
export function scoreInterviewFallback(
  questions: InterviewQuestion[],
  responses: Array<{ question_id: string; answer: string; duration_seconds?: number }>,
): InterviewEvaluation {
  const respMap = new Map(responses.map(r => [r.question_id, r]))
  const per: ScoredResponse[] = []
  const flags = new Set<string>()

  for (const q of questions) {
    const r = respMap.get(q.id)
    const answer = (r?.answer ?? '').trim()
    const words = answer ? answer.split(/\s+/).length : 0

    // STAR coverage
    const starHits = Object.values(STAR_SIGNALS).filter(re => re.test(answer)).length
    const structure = Math.round((starHits / 4) * 100)

    // Relevancy: overlap of meaningful question tokens with the answer
    const qTokens = q.prompt.toLowerCase().match(/[a-z]{4,}/g) ?? []
    const aLower = answer.toLowerCase()
    const overlap = qTokens.length
      ? qTokens.filter(t => aLower.includes(t)).length / qTokens.length
      : 0
    const relevancy = Math.min(100, Math.round(overlap * 70 + (words > 30 ? 30 : words)))

    // Communication: length sweet-spot 60–220 words, penalise too short / rambling
    let communication: number
    if (words === 0) communication = 0
    else if (words < 25) communication = 35
    else if (words <= 220) communication = 90
    else communication = 70
    // filler-word penalty
    const fillers = (answer.match(/\b(um|uh|like|you know|basically|actually)\b/gi) ?? []).length
    communication = Math.max(0, communication - Math.min(20, fillers * 3))

    const score = answer
      ? Math.round(relevancy * 0.4 + structure * 0.35 + communication * 0.25)
      : 0

    // crude integrity heuristic: very long, perfectly fluent, zero fillers
    if (words > 180 && fillers === 0 && structure >= 75) flags.add('unusually_polished')

    per.push({
      question_id: q.id,
      competency: q.competency,
      relevancy, structure, communication, score,
      notes: !answer ? 'No answer recorded.'
        : starHits >= 3 ? 'Well-structured, complete STAR answer.'
        : starHits === 2 ? 'Partial structure — add a clear result/impact.'
        : 'Lacks structure — frame as Situation, Task, Action, Result.',
    })
  }

  const answered = per.filter(p => p.score > 0)
  const avg = (key: keyof Pick<ScoredResponse, 'relevancy' | 'communication' | 'structure' | 'score'>) =>
    answered.length ? Math.round(answered.reduce((s, p) => s + (p[key] as number), 0) / answered.length) : 0

  const relevancy = avg('relevancy')
  const communication = avg('communication')
  const structure = avg('structure')
  const overall_score = answered.length
    ? Math.round((avg('score') * answered.length) / questions.length) // unanswered drag the mean
    : 0

  const recommendation: InterviewEvaluation['recommendation'] =
    overall_score >= 80 ? 'strong_yes' : overall_score >= 65 ? 'yes' : overall_score >= 45 ? 'maybe' : 'no'

  const strengths: string[] = []
  const concerns: string[] = []
  if (structure >= 70) strengths.push('Answers consistently follow the STAR structure.')
  if (relevancy >= 70) strengths.push('Responses stay on-topic and address the question asked.')
  if (communication >= 80) strengths.push('Clear, well-paced communication.')
  if (structure < 50) concerns.push('Answers often lack a clear result/impact — coach on STAR.')
  if (relevancy < 50) concerns.push('Some responses drift off the question.')
  if (answered.length < questions.length) concerns.push(`${questions.length - answered.length} question(s) left unanswered.`)
  if (!strengths.length) strengths.push('Completed the interview.')

  return {
    scores: { relevancy, communication, structure, role_expertise: avg('score'), per_question: per },
    overall_score,
    recommendation,
    strengths,
    concerns,
    summary: `Candidate scored ${overall_score}/100 across ${answered.length}/${questions.length} answered questions. ` +
      `Strongest on ${communication >= structure ? 'communication' : 'structure'}; ` +
      `recommendation: ${recommendation.replace('_', ' ')}.`,
    integrity_flags: [...flags],
  }
}

/* ─── Formatting helpers (for the storefront/board UI) ──────────────────── */

export function formatSalary(
  min?: number | null, max?: number | null, currency = 'INR', period = 'year',
): string {
  if (!min && !max) return 'Not disclosed'
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency + ' '
  const fmt = (n: number) => {
    if (currency === 'INR') {
      if (n >= 1e7) return `${(n / 1e7).toFixed(n % 1e7 ? 1 : 0)}Cr`
      if (n >= 1e5) return `${(n / 1e5).toFixed(n % 1e5 ? 1 : 0)}L`
      if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
    } else if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
    return `${n}`
  }
  const p = period === 'year' ? '/yr' : period === 'month' ? '/mo' : '/hr'
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}${p}`
  return `${sym}${fmt((min || max)!)}${p}+`
}

export function formatExperience(min?: number | null, max?: number | null): string {
  const lo = Number(min ?? 0)
  if (max != null) return `${lo}–${Number(max)} yrs`
  return lo > 0 ? `${lo}+ yrs` : 'Any experience'
}

/** Aggregate a list of applications into funnel counts for the cockpit. */
export function funnelCounts(apps: Array<{ stage: string }>): Record<Stage, number> {
  const counts = Object.fromEntries(PIPELINE_STAGES.map(s => [s, 0])) as Record<Stage, number>
  for (const a of apps) {
    if ((counts as any)[a.stage] !== undefined) counts[a.stage as Stage]++
  }
  return counts
}
