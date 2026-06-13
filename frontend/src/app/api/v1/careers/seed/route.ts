import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { slugify, profileScore, DEFAULT_COMPETENCIES, computeMatch, buildFallbackInterview } from '@/lib/services/careers'

const ALLOWED = new Set(['admin', 'hr'])
const tok = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

const JOBS = [
  {
    title: 'Senior Backend Engineer', code: 'ENG-SBE-026', department_name: 'Engineering',
    summary: 'Own our payments and ledger services end-to-end.',
    description: 'We are looking for a senior backend engineer to design and scale the services that power money movement across the platform. You will work with Postgres, Node/TypeScript and event-driven jobs.',
    responsibilities: ['Design and own backend services', 'Lead on data modelling and reliability', 'Mentor mid-level engineers'],
    requirements: ['5+ yrs backend', 'Strong Postgres', 'Distributed systems'],
    perks: ['ESOPs', 'Remote-first', 'Top-tier health cover'],
    skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Redis', 'System Design'],
    employment_type: 'full_time', work_mode: 'remote', experience_level: 'senior',
    min_experience: 5, max_experience: 9, location: 'Remote (India)',
    salary_min: 3500000, salary_max: 5500000, is_featured: true,
  },
  {
    title: 'Product Manager — Growth', code: 'PRD-PMG-026', department_name: 'Product',
    summary: 'Drive activation and retention for millions of users.',
    description: 'Lead the growth pod. Define the roadmap, run experiments, and partner with design and engineering to move the north-star metric.',
    responsibilities: ['Own the growth roadmap', 'Run A/B experiments', 'Define and track KPIs'],
    requirements: ['4+ yrs PM', 'Data-driven', 'B2C experience'],
    perks: ['ESOPs', 'Hybrid', 'Learning budget'],
    skills: ['Product Strategy', 'Analytics', 'A/B Testing', 'SQL', 'Roadmapping'],
    employment_type: 'full_time', work_mode: 'hybrid', experience_level: 'senior',
    min_experience: 4, max_experience: 8, location: 'Bengaluru, IN',
    salary_min: 4000000, salary_max: 6000000, is_urgent: true,
  },
  {
    title: 'Senior Product Designer', code: 'DES-SPD-026', department_name: 'Design',
    summary: 'Shape delightful, accessible product experiences.',
    description: 'Own design for a core surface. From research to high-fidelity and design systems.',
    responsibilities: ['End-to-end product design', 'Contribute to the design system', 'Run usability research'],
    requirements: ['4+ yrs product design', 'Strong portfolio', 'Figma mastery'],
    perks: ['Hybrid', 'Latest hardware', 'Conference budget'],
    skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping', 'Accessibility'],
    employment_type: 'full_time', work_mode: 'hybrid', experience_level: 'senior',
    min_experience: 4, max_experience: 8, location: 'Mumbai, IN',
    salary_min: 2800000, salary_max: 4200000,
  },
  {
    title: 'DevOps / Platform Engineer', code: 'ENG-DPE-026', department_name: 'Engineering',
    summary: 'Build the golden path for every team to ship safely.',
    description: 'Own CI/CD, observability and infra-as-code. Kubernetes, Terraform, and a strong reliability mindset.',
    responsibilities: ['Own CI/CD and IaC', 'Improve observability', 'Drive reliability'],
    requirements: ['4+ yrs DevOps', 'Kubernetes', 'Terraform'],
    perks: ['Remote', 'On-call comp', 'ESOPs'],
    skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Observability', 'Go'],
    employment_type: 'full_time', work_mode: 'remote', experience_level: 'mid',
    min_experience: 3, max_experience: 7, location: 'Remote (India)',
    salary_min: 3000000, salary_max: 4800000,
  },
  {
    title: 'Frontend Engineer (React)', code: 'ENG-FE-026', department_name: 'Engineering',
    summary: 'Craft fast, polished interfaces with React and Next.js.',
    description: 'Build the user-facing product with React 19, Next.js and Tailwind. Care about performance and craft.',
    responsibilities: ['Build product UI', 'Own performance', 'Partner closely with design'],
    requirements: ['3+ yrs React', 'TypeScript', 'CSS craft'],
    perks: ['Remote', 'Flexible hours', 'ESOPs'],
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Testing'],
    employment_type: 'full_time', work_mode: 'remote', experience_level: 'mid',
    min_experience: 3, max_experience: 6, location: 'Remote (India)',
    salary_min: 2200000, salary_max: 3800000,
  },
  {
    title: 'Data Analyst', code: 'DAT-DA-026', department_name: 'Data',
    summary: 'Turn raw data into decisions the whole company trusts.',
    description: 'Own dashboards and deep-dive analyses. SQL, a BI tool, and a knack for clear storytelling.',
    responsibilities: ['Build dashboards', 'Run analyses', 'Define metrics'],
    requirements: ['2+ yrs analytics', 'Strong SQL', 'BI tooling'],
    perks: ['Hybrid', 'Learning budget'],
    skills: ['SQL', 'Python', 'Tableau', 'Statistics', 'Data Modelling'],
    employment_type: 'full_time', work_mode: 'hybrid', experience_level: 'junior',
    min_experience: 2, max_experience: 5, location: 'Bengaluru, IN',
    salary_min: 1400000, salary_max: 2400000,
  },
]

const CANDIDATES = [
  { full_name: 'Arjun Menon', email: 'arjun.menon@example.com', phone: '+91 98765 43210', headline: 'Senior Backend Engineer @ Razorpay', location: 'Bengaluru, IN', summary: 'Backend engineer with 7 years building high-scale payment systems. I led the ledger rewrite that cut reconciliation time by 80% and mentored a team of five. I care deeply about correctness, observability and clean data models.', skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Redis', 'System Design', 'Kafka'], experience_years: 7, current_company: 'Razorpay', current_title: 'SDE-3', current_ctc: 3200000, expected_ctc: 4800000, notice_period_days: 60, source: 'linkedin', open_to_remote: true },
  { full_name: 'Kavya Nair', email: 'kavya.nair@example.com', phone: '+91 87654 32109', headline: 'Product Manager @ Flipkart', location: 'Bengaluru, IN', summary: 'Growth PM with 6 years driving activation and retention for consumer apps. Shipped an onboarding revamp that lifted D7 retention by 14%. Strong on experimentation and analytics.', skills: ['Product Strategy', 'Analytics', 'A/B Testing', 'SQL', 'Roadmapping', 'Figma'], experience_years: 6, current_company: 'Flipkart', current_title: 'Senior PM', current_ctc: 4200000, expected_ctc: 5800000, notice_period_days: 90, source: 'referral', open_to_remote: false },
  { full_name: 'Rohan Gupta', email: 'rohan.gupta@example.com', phone: '+91 76543 21098', headline: 'DevOps Engineer @ TCS', location: 'Pune, IN', summary: 'Platform engineer with 5 years owning Kubernetes and CI/CD for large teams. Migrated 40+ services to a GitOps workflow and cut deploy time from hours to minutes.', skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Observability', 'Go', 'Docker'], experience_years: 5, current_company: 'TCS', current_title: 'DevOps Lead', current_ctc: 2400000, expected_ctc: 3600000, notice_period_days: 30, source: 'naukri', open_to_remote: true },
  { full_name: 'Meera Pillai', email: 'meera.pillai@example.com', phone: '+91 65432 10987', headline: 'Product Designer @ Swiggy', location: 'Mumbai, IN', summary: 'Product designer with 5 years across fintech and food-tech. Owned the redesign of the order-tracking flow and contributed heavily to the design system.', skills: ['Figma', 'UX Research', 'Design Systems', 'Prototyping', 'Accessibility'], experience_years: 5, current_company: 'Swiggy', current_title: 'Senior Designer', current_ctc: 2600000, expected_ctc: 3800000, notice_period_days: 45, source: 'direct', open_to_remote: true },
  { full_name: 'Siddharth Rao', email: 'siddharth.rao@example.com', phone: '+91 54321 09876', headline: 'Frontend Engineer @ CRED', location: 'Remote, IN', summary: 'Frontend engineer with 4 years of React and Next.js. Obsessed with performance — got our LCP under 1s on the main funnel. Strong TypeScript and testing discipline.', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Testing', 'GraphQL'], experience_years: 4, current_company: 'CRED', current_title: 'SDE-2', current_ctc: 2800000, expected_ctc: 3600000, notice_period_days: 30, source: 'linkedin', open_to_remote: true },
  { full_name: 'Ananya Sharma', email: 'ananya.sharma@example.com', phone: '+91 91234 56780', headline: 'Data Analyst @ Zomato', location: 'Gurugram, IN', summary: 'Analyst with 3 years turning messy data into clear decisions. Built the self-serve metrics layer used by 200+ employees.', skills: ['SQL', 'Python', 'Tableau', 'Statistics', 'Data Modelling', 'dbt'], experience_years: 3, current_company: 'Zomato', current_title: 'Analyst II', current_ctc: 1600000, expected_ctc: 2200000, notice_period_days: 30, source: 'portal', open_to_remote: false },
  { full_name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+91 99887 76655', headline: 'Backend Engineer @ Paytm', location: 'Noida, IN', summary: 'Backend engineer, 6 years, strong in Java and Postgres moving toward Node. Built fraud-detection pipelines processing millions of events daily.', skills: ['Java', 'PostgreSQL', 'Kafka', 'AWS', 'System Design', 'Node.js'], experience_years: 6, current_company: 'Paytm', current_title: 'SDE-3', current_ctc: 3000000, expected_ctc: 4200000, notice_period_days: 60, source: 'naukri', open_to_remote: true },
  { full_name: 'Priya Desai', email: 'priya.desai@example.com', phone: '+91 90011 22334', headline: 'Associate PM @ PhonePe', location: 'Bengaluru, IN', summary: 'APM with 3 years, growth-focused. Ran the referral program experiments that added 5% to weekly signups.', skills: ['Product Strategy', 'Analytics', 'SQL', 'A/B Testing'], experience_years: 3, current_company: 'PhonePe', current_title: 'APM', current_ctc: 2200000, expected_ctc: 3200000, notice_period_days: 30, source: 'referral', open_to_remote: false },
]

export async function POST() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const company_id = employee.company_id

  // Skip if already seeded
  const { count } = await supabase.from('career_jobs').select('id', { count: 'exact', head: true }).eq('company_id', company_id)
  if ((count ?? 0) > 0) return NextResponse.json({ ok: true, skipped: true, message: 'Career data already exists' })

  // 1. Jobs
  const jobRows = JOBS.map(j => ({
    ...j, company_id, slug: slugify(j.title) + '-' + Math.random().toString(36).slice(2, 6),
    currency: 'INR', salary_period: 'year', show_salary: true, openings: 1 + (Math.random() * 2 | 0),
    ai_interview_enabled: true, ai_competencies: [...DEFAULT_COMPETENCIES], ai_question_count: 5,
    status: 'open', posted_by: employee.id, hiring_manager_id: employee.id,
    published_at: new Date(Date.now() - (Math.random() * 20 | 0) * 864e5).toISOString(),
  }))
  const { data: jobs, error: jErr } = await supabase.from('career_jobs').insert(jobRows).select()
  if (jErr) return NextResponse.json({ error: jErr.message }, { status: 400 })

  // 2. Candidates
  const candRows = CANDIDATES.map(c => ({ ...c, company_id, open_to_work: true, status: 'active', profile_score: profileScore(c) }))
  const { data: cands, error: cErr } = await supabase.from('career_candidates').insert(candRows).select()
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })

  // 3. Applications — best-matched candidate to each job + a couple extra, varied stages
  const STAGES = ['applied', 'applied', 'screening', 'interview', 'interview', 'offer']
  const apps: any[] = []
  const events: any[] = []
  const interviews: any[] = []
  let seq = 1
  for (const job of jobs!) {
    // rank candidates for this job, take top 3
    const ranked = cands!.map(cand => ({ cand, m: computeMatch({ jobSkills: job.skills, candidateSkills: cand.skills, jobMinExp: job.min_experience, jobMaxExp: job.max_experience, candidateExp: cand.experience_years, jobWorkMode: job.work_mode, candidateOpenToRemote: cand.open_to_remote, jobLocation: job.location, candidateLocation: cand.location }) }))
      .sort((a, b) => b.m.score - a.m.score).slice(0, 3)
    for (let i = 0; i < ranked.length; i++) {
      const { cand, m } = ranked[i]
      const stage = STAGES[(seq + i) % STAGES.length]
      const appId = crypto.randomUUID()
      const ivScore = ['interview', 'offer'].includes(stage) ? 60 + (Math.random() * 35 | 0) : null
      apps.push({
        id: appId, company_id, job_id: job.id, candidate_id: cand.id,
        reference_no: `APP-2026-${String(seq).padStart(4, '0')}`,
        stage, status: stage === 'rejected' ? 'closed' : 'active', source: cand.source,
        ai_match_score: m.score, ai_match_reasons: m.reasons, ai_interview_score: ivScore,
        applied_at: new Date(Date.now() - (Math.random() * 18 | 0) * 864e5).toISOString(),
      })
      events.push({ company_id, application_id: appId, event_type: 'applied', to_stage: 'applied', message: `Applied to ${job.title} · AI match ${m.score}%`, actor_name: cand.full_name })
      // an interview record for in-interview/offer stages
      if (ivScore != null) {
        const qs = buildFallbackInterview({ competencies: [...DEFAULT_COMPETENCIES], count: 5, jobTitle: job.title })
        const rec = ivScore >= 80 ? 'strong_yes' : ivScore >= 65 ? 'yes' : 'maybe'
        interviews.push({
          company_id, application_id: appId, job_id: job.id, candidate_id: cand.id,
          access_token: tok(), questions: qs, status: 'completed', overall_score: ivScore,
          recommendation: rec,
          scores: { relevancy: ivScore, communication: Math.min(100, ivScore + 5), structure: Math.max(0, ivScore - 8), role_expertise: ivScore, per_question: [] },
          strengths: ['Clear, structured STAR answers', 'Strong role-relevant examples'],
          concerns: ivScore < 75 ? ['Could quantify impact more'] : [],
          summary: `Candidate scored ${ivScore}/100 with ${rec.replace('_', ' ')} recommendation.`,
          evaluated_by: 'ai', completed_at: new Date().toISOString(),
        })
      }
      seq++
    }
  }
  if (apps.length) {
    await supabase.from('career_applications').insert(apps)
    await supabase.from('career_application_events').insert(events)
  }
  if (interviews.length) await supabase.from('career_interviews').insert(interviews)

  // 4. Settings
  await supabase.from('career_settings').upsert({
    company_id, brand_name: 'PRSK Careers', tagline: 'Build what millions rely on.',
    about: 'Join a team shipping enterprise-grade software end to end.',
    perks: ['ESOPs for all', 'Remote-first', 'Top-tier health cover', 'Learning budget'],
    ai_interview_default: true, auto_screen: true, allow_ai_disclosure: true,
  }, { onConflict: 'company_id' })

  return NextResponse.json({ ok: true, jobs: jobs!.length, candidates: cands!.length, applications: apps.length, interviews: interviews.length })
}
