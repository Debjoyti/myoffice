'use client'

import { useState } from 'react'
import { PageHeader, Card, Button, Input, Select, Textarea, Badge } from '@/components/ui'
import { Zap, Copy, Download, RefreshCcw, Sparkles } from 'lucide-react'

const SAMPLE_JD = `## Senior Software Engineer — Engineering

**About the Role**
We're looking for a Senior Software Engineer to join our core platform team at PRSK. You'll own critical backend services, mentor junior engineers, and help shape our technical roadmap.

**Responsibilities**
- Design, build, and maintain scalable APIs and backend services (Node.js / TypeScript)
- Lead code reviews and set engineering best practices for the team
- Collaborate with Product and Design to translate requirements into technical solutions
- Participate in on-call rotation and production incident response
- Drive performance improvements and system reliability initiatives

**Requirements**
- 4+ years of professional software engineering experience
- Strong proficiency in TypeScript / Node.js or similar backend stack
- Experience with PostgreSQL, Redis, and event-driven architectures
- Familiarity with CI/CD pipelines and containerisation (Docker / Kubernetes)
- Excellent communication and problem-solving skills

**Nice to Have**
- Experience with Supabase, Next.js, or serverless platforms
- Prior experience at a SaaS or high-growth startup
- Open-source contributions

**What We Offer**
- Competitive CTC with ESOP pool
- Flexible hybrid work policy
- Learning budget of ₹50,000/year
- 25 days of paid time off`

export default function JobStudioPage() {
  const [brief, setBrief] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('Mid-Level')
  const [generated, setGenerated] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!role.trim()) return
    setGenerating(true)
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 1500))
    setGenerated(SAMPLE_JD.replace('Senior Software Engineer', `${level} ${role}`).replace('Engineering', department || 'Engineering'))
    setGenerating(false)
  }

  const handleCopy = () => {
    if (!generated) return
    navigator.clipboard.writeText(generated)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Job Studio"
        description="AI-powered job description generator — create compelling JDs in seconds"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Describe the Role</h3>
          </div>

          <div className="space-y-4">
            <Input
              label="Job Title *"
              placeholder="e.g. Product Designer, Data Scientist"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Department"
                placeholder="e.g. Engineering, Sales"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
              <Select
                label="Seniority Level"
                value={level}
                onChange={e => setLevel(e.target.value)}
                options={[
                  { label: 'Intern', value: 'Intern' },
                  { label: 'Junior', value: 'Junior' },
                  { label: 'Mid-Level', value: 'Mid-Level' },
                  { label: 'Senior', value: 'Senior' },
                  { label: 'Lead', value: 'Lead' },
                  { label: 'Manager', value: 'Manager' },
                  { label: 'Director', value: 'Director' },
                ]}
              />
            </div>
            <Textarea
              label="Brief (optional)"
              placeholder="Describe key responsibilities, required skills, team context, or any specific requirements you want the JD to include..."
              value={brief}
              onChange={e => setBrief(e.target.value)}
              rows={5}
            />

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!role.trim() || generating}
              leftIcon={generating ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            >
              {generating ? 'Generating...' : 'Generate with AI'}
            </Button>
          </div>
        </Card>

        {/* Output Panel */}
        <Card className="flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">Generated JD</h3>
              {generated && <Badge variant="success" size="sm">Ready</Badge>}
            </div>
            {generated && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" leftIcon={<Copy className="h-3 w-3" />} onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Download className="h-3 w-3" />}>
                  Export
                </Button>
              </div>
            )}
          </div>

          {generating ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                  <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
                <p className="text-sm text-slate-600">AI is crafting your job description...</p>
                <p className="text-xs text-slate-400">Analysing role, seniority, and industry context</p>
              </div>
            </div>
          ) : generated ? (
            <div className="flex-1 overflow-y-auto">
              <pre className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{generated}</pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Fill in the role details and click Generate</p>
                <p className="text-xs text-slate-400">AI will create a complete, compelling JD in seconds</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Tips for Better JDs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { tip: 'Be specific with seniority', detail: "Specifying \"Senior\" vs \"Mid-Level\" dramatically changes the required experience and tone of the JD." },
            { tip: 'Add a context brief', detail: 'A short brief about team size, tech stack, or product area helps AI tailor the responsibilities section.' },
            { tip: 'Review before posting', detail: 'Always review AI output for company-specific details like salary bands, perks, and culture notes.' },
          ].map(t => (
            <div key={t.tip} className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-800 mb-1">💡 {t.tip}</p>
              <p className="text-xs text-blue-700 leading-relaxed">{t.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
