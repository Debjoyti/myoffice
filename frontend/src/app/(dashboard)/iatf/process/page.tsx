'use client'

import { useEffect, useState } from 'react'
import {
  PageHeader, TabBar, Card, Badge, Button, EmptyState, Modal, Input, Textarea, Select, Skeleton
} from '@/components/ui'
import { Plus, GitBranch } from 'lucide-react'

type ProcessApproach = {
  id: string; process_type: string; title: string; objective: string | null; scope: string | null
  version: number; status: string; inputs: string[]; outputs: string[]; activities: string[]
  resources: string[]; controls: string[]; kpis: string[]; risks: string[]
}

type TurtleDiagram = {
  id: string; process_name: string; version: number; status: string
  input_what: string | null; who_persons: string | null; how_documents: string | null
  what_equipment: string | null; output_what: string | null; how_do_we_know_kpis: string | null
  controls_standards: string | null
}

const STATUS_COLOR: Record<string, 'neutral' | 'warning' | 'success' | 'default'> = {
  draft: 'neutral', approved: 'success', active: 'default'
}

export default function ProcessPage() {
  const [tab, setTab] = useState('approaches')
  const [approaches, setApproaches] = useState<ProcessApproach[]>([])
  const [turtles, setTurtles] = useState<TurtleDiagram[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddApproach, setShowAddApproach] = useState(false)
  const [showAddTurtle, setShowAddTurtle] = useState(false)
  const [selectedApproach, setSelectedApproach] = useState<ProcessApproach | null>(null)
  const [selectedTurtle, setSelectedTurtle] = useState<TurtleDiagram | null>(null)
  const [saving, setSaving] = useState(false)

  const [approachForm, setApproachForm] = useState({
    process_type: 'motivation', title: '', objective: '', scope: '',
    inputs: '', outputs: '', activities: '', resources: '', controls: '', kpis: '', risks: '',
  })
  const [turtleForm, setTurtleForm] = useState({
    process_name: '', input_what: '', who_persons: '', how_documents: '',
    what_equipment: '', output_what: '', how_do_we_know_kpis: '', controls_standards: '',
  })

  useEffect(() => {
    setLoading(false) // no dedicated API for process approaches in current routes — placeholder
  }, [])

  async function handleCreateApproach() {
    setSaving(true)
    try {
      // Process approaches are stored via supabase directly in production
      // For demo, just add to local state
      const newApproach: ProcessApproach = {
        id: crypto.randomUUID(),
        process_type: approachForm.process_type,
        title: approachForm.title,
        objective: approachForm.objective || null,
        scope: approachForm.scope || null,
        version: 1,
        status: 'draft',
        inputs: approachForm.inputs.split('\n').filter(Boolean),
        outputs: approachForm.outputs.split('\n').filter(Boolean),
        activities: approachForm.activities.split('\n').filter(Boolean),
        resources: approachForm.resources.split('\n').filter(Boolean),
        controls: approachForm.controls.split('\n').filter(Boolean),
        kpis: approachForm.kpis.split('\n').filter(Boolean),
        risks: approachForm.risks.split('\n').filter(Boolean),
      }
      setApproaches(prev => [newApproach, ...prev])
      setShowAddApproach(false)
      setApproachForm({ process_type: 'motivation', title: '', objective: '', scope: '', inputs: '', outputs: '', activities: '', resources: '', controls: '', kpis: '', risks: '' })
    } finally {
      setSaving(false)
    }
  }

  function handleCreateTurtle() {
    setSaving(true)
    try {
      const newTurtle: TurtleDiagram = {
        id: crypto.randomUUID(),
        process_name: turtleForm.process_name,
        version: 1,
        status: 'draft',
        input_what: turtleForm.input_what || null,
        who_persons: turtleForm.who_persons || null,
        how_documents: turtleForm.how_documents || null,
        what_equipment: turtleForm.what_equipment || null,
        output_what: turtleForm.output_what || null,
        how_do_we_know_kpis: turtleForm.how_do_we_know_kpis || null,
        controls_standards: turtleForm.controls_standards || null,
      }
      setTurtles(prev => [newTurtle, ...prev])
      setShowAddTurtle(false)
      setTurtleForm({ process_name: '', input_what: '', who_persons: '', how_documents: '', what_equipment: '', output_what: '', how_do_we_know_kpis: '', controls_standards: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Process Management"
        description="Process approaches for motivation & training, and turtle diagrams"
        actions={
          tab === 'approaches' ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddApproach(true)}>
              New Process
            </Button>
          ) : (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddTurtle(true)}>
              New Turtle Diagram
            </Button>
          )
        }
      />

      <TabBar
        tabs={[
          { id: 'approaches', label: 'Process Approaches', count: approaches.length },
          { id: 'turtle', label: 'Turtle Diagrams', count: turtles.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Process Approaches */}
      {tab === 'approaches' && (
        loading ? (
          <div className="space-y-4">{Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-32 w-full"/>)}</div>
        ) : approaches.length === 0 ? (
          <EmptyState
            icon={<GitBranch className="h-6 w-6" />}
            title="No process approaches defined"
            description="Document motivation and training process approaches for IATF 16949 compliance."
            action={<Button size="sm" onClick={() => setShowAddApproach(true)}>New Process</Button>}
          />
        ) : (
          <div className="space-y-4">
            {approaches.map(ap => (
              <Card key={ap.id} hover onClick={() => setSelectedApproach(ap)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={ap.process_type === 'motivation' ? 'default' : 'info'} size="sm">{ap.process_type}</Badge>
                      <Badge variant={STATUS_COLOR[ap.status] ?? 'neutral'} size="sm">{ap.status} v{ap.version}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ap.title}</h3>
                    {ap.objective && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ap.objective}</p>}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 text-xs text-slate-500">
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">Inputs:</span> {ap.inputs.length}</div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">Outputs:</span> {ap.outputs.length}</div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">KPIs:</span> {ap.kpis.length}</div>
                  <div><span className="font-medium text-slate-700 dark:text-slate-300">Risks:</span> {ap.risks.length}</div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Turtle Diagrams */}
      {tab === 'turtle' && (
        turtles.length === 0 ? (
          <EmptyState
            icon={<GitBranch className="h-6 w-6" />}
            title="No turtle diagrams"
            description="Create the classic 6-sided turtle diagram for process documentation."
            action={<Button size="sm" onClick={() => setShowAddTurtle(true)}>New Turtle Diagram</Button>}
          />
        ) : (
          <div className="space-y-6">
            {turtles.map(t => (
              <Card key={t.id} hover onClick={() => setSelectedTurtle(t)}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.process_name}</h3>
                  <Badge variant={STATUS_COLOR[t.status] ?? 'neutral'} size="sm">{t.status} v{t.version}</Badge>
                </div>
                {/* Turtle diagram visual */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">INPUT (What comes in)</p>
                    <p className="text-slate-600 dark:text-slate-400">{t.input_what ?? '—'}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                    <p className="font-semibold text-indigo-700 dark:text-indigo-400 mb-1">WHO (People)</p>
                    <p className="text-slate-600 dark:text-slate-400">{t.who_persons ?? '—'}</p>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
                    <p className="font-semibold text-violet-700 dark:text-violet-400 mb-1">OUTPUT (What goes out)</p>
                    <p className="text-slate-600 dark:text-slate-400">{t.output_what ?? '—'}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                    <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">HOW (Documents/Methods)</p>
                    <p className="text-slate-600 dark:text-slate-400">{t.how_documents ?? '—'}</p>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">PROCESS</p>
                      <p className="text-xs text-slate-500">{t.process_name}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">EQUIPMENT (With What)</p>
                    <p className="text-slate-600 dark:text-slate-400">{t.what_equipment ?? '—'}</p>
                  </div>
                  <div className="col-span-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="font-semibold text-rose-700 dark:text-rose-400 mb-1">KPIs (How do we know?)</p>
                        <p className="text-slate-600 dark:text-slate-400">{t.how_do_we_know_kpis ?? '—'}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-rose-700 dark:text-rose-400 mb-1">Controls & Standards</p>
                        <p className="text-slate-600 dark:text-slate-400">{t.controls_standards ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Process Approach Detail Modal */}
      <Modal
        open={!!selectedApproach}
        onClose={() => setSelectedApproach(null)}
        title={selectedApproach?.title ?? ''}
        size="xl"
      >
        {selectedApproach && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-slate-500 uppercase font-semibold">Type</span><p className="text-sm capitalize">{selectedApproach.process_type}</p></div>
              <div><span className="text-xs text-slate-500 uppercase font-semibold">Status</span><Badge variant={STATUS_COLOR[selectedApproach.status] ?? 'neutral'} size="sm" className="mt-1">{selectedApproach.status}</Badge></div>
            </div>
            {selectedApproach.objective && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Objective</p><p className="text-sm">{selectedApproach.objective}</p></div>}
            {selectedApproach.scope && <div><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Scope</p><p className="text-sm">{selectedApproach.scope}</p></div>}
            <div className="grid grid-cols-2 gap-4">
              {[['Inputs', selectedApproach.inputs], ['Outputs', selectedApproach.outputs], ['Activities', selectedApproach.activities], ['Resources', selectedApproach.resources], ['Controls', selectedApproach.controls], ['KPIs', selectedApproach.kpis], ['Risks', selectedApproach.risks]].map(([label, items]) => (
                <div key={String(label)}>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{String(label)}</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {(items as string[]).map((item, i) => <li key={i} className="text-xs text-slate-700 dark:text-slate-300">{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Process Approach Modal */}
      <Modal
        open={showAddApproach}
        onClose={() => setShowAddApproach(false)}
        title="New Process Approach"
        size="xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddApproach(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateApproach}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Process Type" options={[{label:'Motivation',value:'motivation'},{label:'Training',value:'training'}]} value={approachForm.process_type} onChange={e => setApproachForm(f=>({...f,process_type:e.target.value}))} />
          <Input label="Title" required value={approachForm.title} onChange={e => setApproachForm(f=>({...f,title:e.target.value}))} />
          <Textarea label="Objective" rows={2} value={approachForm.objective} onChange={e => setApproachForm(f=>({...f,objective:e.target.value}))} />
          <Textarea label="Scope" rows={2} value={approachForm.scope} onChange={e => setApproachForm(f=>({...f,scope:e.target.value}))} />
          <div className="grid grid-cols-2 gap-4">
            <Textarea label="Inputs (one per line)" rows={3} value={approachForm.inputs} onChange={e => setApproachForm(f=>({...f,inputs:e.target.value}))} />
            <Textarea label="Outputs (one per line)" rows={3} value={approachForm.outputs} onChange={e => setApproachForm(f=>({...f,outputs:e.target.value}))} />
            <Textarea label="Activities (one per line)" rows={3} value={approachForm.activities} onChange={e => setApproachForm(f=>({...f,activities:e.target.value}))} />
            <Textarea label="Resources (one per line)" rows={3} value={approachForm.resources} onChange={e => setApproachForm(f=>({...f,resources:e.target.value}))} />
            <Textarea label="Controls (one per line)" rows={3} value={approachForm.controls} onChange={e => setApproachForm(f=>({...f,controls:e.target.value}))} />
            <Textarea label="KPIs (one per line)" rows={3} value={approachForm.kpis} onChange={e => setApproachForm(f=>({...f,kpis:e.target.value}))} />
            <Textarea label="Risks (one per line)" rows={3} value={approachForm.risks} onChange={e => setApproachForm(f=>({...f,risks:e.target.value}))} className="col-span-2" />
          </div>
        </div>
      </Modal>

      {/* Add Turtle Diagram Modal */}
      <Modal
        open={showAddTurtle}
        onClose={() => setShowAddTurtle(false)}
        title="New Turtle Diagram"
        size="xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddTurtle(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateTurtle}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Process Name" required value={turtleForm.process_name} onChange={e => setTurtleForm(f=>({...f,process_name:e.target.value}))} />
          <div className="grid grid-cols-2 gap-4">
            <Textarea label="Input — What comes in?" rows={3} value={turtleForm.input_what} onChange={e => setTurtleForm(f=>({...f,input_what:e.target.value}))} />
            <Textarea label="Output — What goes out?" rows={3} value={turtleForm.output_what} onChange={e => setTurtleForm(f=>({...f,output_what:e.target.value}))} />
            <Textarea label="Who — People & Competencies?" rows={3} value={turtleForm.who_persons} onChange={e => setTurtleForm(f=>({...f,who_persons:e.target.value}))} />
            <Textarea label="How — Documents & Methods?" rows={3} value={turtleForm.how_documents} onChange={e => setTurtleForm(f=>({...f,how_documents:e.target.value}))} />
            <Textarea label="With What — Equipment & Tools?" rows={3} value={turtleForm.what_equipment} onChange={e => setTurtleForm(f=>({...f,what_equipment:e.target.value}))} />
            <Textarea label="KPIs — How do we know we are succeeding?" rows={3} value={turtleForm.how_do_we_know_kpis} onChange={e => setTurtleForm(f=>({...f,how_do_we_know_kpis:e.target.value}))} />
            <Textarea label="Controls & Standards" rows={3} value={turtleForm.controls_standards} onChange={e => setTurtleForm(f=>({...f,controls_standards:e.target.value}))} className="col-span-2" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
