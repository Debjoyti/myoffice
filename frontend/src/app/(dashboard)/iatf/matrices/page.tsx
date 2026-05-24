'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  PageHeader, TabBar, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  EmptyState, Modal, Input, Select, Skeleton
} from '@/components/ui'
import { Plus, Grid3x3 } from 'lucide-react'

type SkillDef = { id: string; name: string; category: string | null }
type SkillEntry = { id: string; employee_id: string; skill_id: string; current_level: number; target_level: number; emp: { id: string; users: { full_name: string } } | null; skill: SkillDef }
type CompetencyDef = { id: string; name: string; category: string | null; description: string | null }
type CompetenceEntry = { id: string; designation: string; competency_id: string; required_level: number; is_mandatory: boolean }

const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-slate-100 text-slate-400',
  1: 'bg-red-100 text-red-600',
  2: 'bg-amber-100 text-amber-600',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-emerald-100 text-emerald-700',
}
const LEVEL_LABELS: Record<number, string> = { 0: 'None', 1: 'Aware', 2: 'Basic', 3: 'Proficient', 4: 'Expert' }

export default function MatricesPage() {
  const [tab, setTab] = useState('skill')
  const [loading, setLoading] = useState(true)
  const [skillEntries, setSkillEntries] = useState<SkillEntry[]>([])
  const [skillDefs, setSkillDefs] = useState<SkillDef[]>([])
  const [competencyDefs, setCompetencyDefs] = useState<CompetencyDef[]>([])
  const [competenceEntries, setCompetenceEntries] = useState<CompetenceEntry[]>([])
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [showAddCompetency, setShowAddCompetency] = useState(false)
  const [saving, setSaving] = useState(false)

  const [skillForm, setSkillForm] = useState({ name: '', category: '', description: '' })
  const [entryForm, setEntryForm] = useState({ employee_id: '', skill_id: '', current_level: '2', target_level: '3' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [skillDefsRes, skillEntriesRes] = await Promise.all([
        fetch('/api/v1/iatf/skill-definitions'),
        fetch('/api/v1/iatf/skill-matrix'),
      ])
      if (skillDefsRes.ok) {
        const d = await skillDefsRes.json()
        setSkillDefs(d.data ?? [])
      }
      if (skillEntriesRes.ok) {
        const d = await skillEntriesRes.json()
        setSkillEntries(d.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleAddSkillDef() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/skill-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillForm),
      })
      if (res.ok) {
        setShowAddSkill(false)
        setSkillForm({ name: '', category: '', description: '' })
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpsertEntry() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/skill-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entryForm,
          current_level: parseInt(entryForm.current_level),
          target_level: parseInt(entryForm.target_level),
        }),
      })
      if (res.ok) {
        setShowAddCompetency(false)
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  // Build skill matrix grid: employees (rows) x skills (cols)
  const employees = Array.from(
    new Map(skillEntries.map(e => [e.employee_id, e.emp?.users?.full_name ?? 'Unknown'])).entries()
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matrices"
        description="Skill, competence, and responsibility (RACI) matrices"
        actions={
          tab === 'skill' ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddSkill(true)}>
                Add Skill
              </Button>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddCompetency(true)}>
                Update Entry
              </Button>
            </div>
          ) : undefined
        }
      />

      <TabBar
        tabs={[
          { id: 'skill', label: 'Skill Matrix' },
          { id: 'competence', label: 'Competence Matrix' },
          { id: 'raci', label: 'RACI / Responsibility' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Skill Matrix Tab */}
      {tab === 'skill' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <CardHeader
              title="Skill Matrix"
              description="Employee skill proficiency levels (0=None, 1=Aware, 2=Basic, 3=Proficient, 4=Expert)"
            />
            <div className="flex items-center gap-3 mt-2">
              {Object.entries(LEVEL_LABELS).map(([level, label]) => (
                <div key={level} className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold ${LEVEL_COLORS[parseInt(level)]}`}>{level}</span>
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
          ) : skillDefs.length === 0 ? (
            <EmptyState
              icon={<Grid3x3 className="h-6 w-6" />}
              title="No skills defined"
              description="Add skill definitions to build the matrix."
              action={<Button size="sm" onClick={() => setShowAddSkill(true)}>Add Skill</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 min-w-[160px]">Employee</th>
                    {skillDefs.map(skill => (
                      <th key={skill.id} className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">
                        <span className="block truncate max-w-[90px]" title={skill.name}>{skill.name}</span>
                        {skill.category && <span className="text-[10px] font-normal normal-case text-slate-400">{skill.category}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={skillDefs.length + 1} className="text-center text-sm text-slate-400 py-8">
                        No skill entries yet. Use &quot;Update Entry&quot; to add data.
                      </td>
                    </tr>
                  ) : (
                    employees.map(([empId, empName]) => (
                      <tr key={empId} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 sticky left-0 bg-inherit z-10">{empName}</td>
                        {skillDefs.map(skill => {
                          const entry = skillEntries.find(e => e.employee_id === empId && e.skill_id === skill.id)
                          const level = entry?.current_level ?? 0
                          return (
                            <td key={skill.id} className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold ${LEVEL_COLORS[level]}`} title={LEVEL_LABELS[level]}>
                                {level}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Competence Matrix Tab */}
      {tab === 'competence' && (
        <Card>
          <CardHeader title="Competence Matrix" description="Required competency levels by designation and department" />
          {competenceEntries.length === 0 ? (
            <EmptyState
              icon={<Grid3x3 className="h-6 w-6" />}
              title="No competence matrix defined"
              description="Define required competencies per designation."
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Designation</Th>
                  <Th>Competency</Th>
                  <Th>Required Level</Th>
                  <Th>Mandatory</Th>
                </tr>
              </Thead>
              <Tbody>
                {competenceEntries.map(e => (
                  <Tr key={e.id}>
                    <Td>{e.designation}</Td>
                    <Td>{competencyDefs.find(c => c.id === e.competency_id)?.name ?? e.competency_id}</Td>
                    <Td><span className={`inline-flex items-center justify-center h-6 w-6 rounded text-xs font-bold ${LEVEL_COLORS[e.required_level]}`}>{e.required_level}</span></Td>
                    <Td>{e.is_mandatory ? <Badge variant="danger" size="sm">Mandatory</Badge> : <Badge variant="neutral" size="sm">Optional</Badge>}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
          <div className="mt-4 text-xs text-slate-500">
            Note: Competence matrix entries are managed via API. UI editor coming soon.
          </div>
        </Card>
      )}

      {/* RACI Matrix Tab */}
      {tab === 'raci' && (
        <Card>
          <CardHeader title="Responsibility Matrix (RACI)" description="Who is Responsible, Accountable, Consulted, and Informed for each process activity" />
          <EmptyState
            icon={<Grid3x3 className="h-6 w-6" />}
            title="No RACI matrices defined"
            description="Create responsibility matrices to clarify process ownership."
            action={
              <div className="text-sm text-slate-500">Manage via API: POST /api/v1/iatf/responsibility-matrix</div>
            }
          />
          <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Process Activity</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-red-600">R</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600">A</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600">C</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600">I</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-6 text-center text-slate-400 text-sm" colSpan={5}>No data. Add responsibility matrix entries to populate.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-slate-500">
            <span><strong className="text-red-600">R</strong> — Responsible</span>
            <span><strong className="text-amber-600">A</strong> — Accountable</span>
            <span><strong className="text-blue-600">C</strong> — Consulted</span>
            <span><strong className="text-emerald-600">I</strong> — Informed</span>
          </div>
        </Card>
      )}

      {/* Add Skill Definition Modal */}
      <Modal
        open={showAddSkill}
        onClose={() => setShowAddSkill(false)}
        title="Add Skill Definition"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddSkill(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleAddSkillDef}>Add Skill</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Skill Name" required value={skillForm.name} onChange={e => setSkillForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Category" placeholder="e.g. Technical, Soft Skill, Safety" value={skillForm.category} onChange={e => setSkillForm(f => ({ ...f, category: e.target.value }))} />
          <Input label="Description" value={skillForm.description} onChange={e => setSkillForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>

      {/* Update Skill Entry Modal */}
      <Modal
        open={showAddCompetency}
        onClose={() => setShowAddCompetency(false)}
        title="Update Skill Matrix Entry"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddCompetency(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleUpsertEntry}>Save Entry</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Employee ID (UUID)" placeholder="Enter employee UUID" required value={entryForm.employee_id} onChange={e => setEntryForm(f => ({ ...f, employee_id: e.target.value }))} />
          <Select
            label="Skill"
            required
            options={[{ label: 'Select skill...', value: '' }, ...skillDefs.map(s => ({ label: s.name, value: s.id }))]}
            value={entryForm.skill_id}
            onChange={e => setEntryForm(f => ({ ...f, skill_id: e.target.value }))}
          />
          <Select
            label="Current Level"
            options={Object.entries(LEVEL_LABELS).map(([v, l]) => ({ label: `${v} – ${l}`, value: v }))}
            value={entryForm.current_level}
            onChange={e => setEntryForm(f => ({ ...f, current_level: e.target.value }))}
          />
          <Select
            label="Target Level"
            options={Object.entries(LEVEL_LABELS).map(([v, l]) => ({ label: `${v} – ${l}`, value: v }))}
            value={entryForm.target_level}
            onChange={e => setEntryForm(f => ({ ...f, target_level: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
