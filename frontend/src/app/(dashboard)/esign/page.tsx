'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import {
  PenTool, Plus, Send, Eye, CheckCircle2, Clock, AlertCircle,
  FileText, Download, Users, Zap, Shield, Copy
} from 'lucide-react'

const MOCK_DOCUMENTS = [
  { id: '1', title: 'Employment Agreement — Arjun Mehta', template: 'Employment Contract', signers: [{ name: 'Arjun Mehta', status: 'signed', at: '2026-05-29 10:15 AM' }, { name: 'HR Manager', status: 'signed', at: '2026-05-29 10:18 AM' }], created: '2026-05-28', expires: '2026-06-28', status: 'completed' },
  { id: '2', title: 'Vendor NDA — BFW India Ltd', template: 'NDA', signers: [{ name: 'Satish Patel (BFW)', status: 'pending', at: null }, { name: 'Legal Team', status: 'signed', at: '2026-05-27 3:00 PM' }], created: '2026-05-27', expires: '2026-06-27', status: 'awaiting' },
  { id: '3', title: 'Offer Letter — Priya Sharma', template: 'Offer Letter', signers: [{ name: 'Priya Sharma', status: 'signed', at: '2026-05-30 2:00 PM' }, { name: 'HR Manager', status: 'signed', at: '2026-05-28 11:00 AM' }], created: '2026-05-28', expires: '2026-06-07', status: 'completed' },
  { id: '4', title: 'Service Agreement — TCS Project', template: 'Service Agreement', signers: [{ name: 'TCS Procurement', status: 'pending', at: null }, { name: 'Sales Director', status: 'pending', at: null }], created: '2026-05-25', expires: '2026-06-08', status: 'sent' },
  { id: '5', title: 'Salary Revision Letter — Rahul Gupta', template: 'Salary Letter', signers: [{ name: 'Rahul Gupta', status: 'pending', at: null }, { name: 'HR Manager', status: 'signed', at: '2026-05-20 9:00 AM' }], created: '2026-05-20', expires: '2026-06-01', status: 'awaiting' },
]

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Employment Contract', fields: 8, used: 24 },
  { id: 't2', name: 'Offer Letter', fields: 5, used: 18 },
  { id: 't3', name: 'NDA', fields: 4, used: 12 },
  { id: 't4', name: 'Vendor Agreement', fields: 6, used: 8 },
  { id: 't5', name: 'Service Agreement', fields: 7, used: 6 },
  { id: 't6', name: 'Salary Revision Letter', fields: 3, used: 15 },
]

const STATUS_VARIANT: Record<string, any> = { completed: 'success', awaiting: 'warning', sent: 'info', expired: 'danger', draft: 'neutral' }
const SIGNER_VARIANT: Record<string, any> = { signed: 'success', pending: 'warning', declined: 'danger' }

export default function ESignPage() {
  const [tab, setTab] = useState('documents')
  const [newDoc, setNewDoc] = useState(false)
  const [viewDoc, setViewDoc] = useState<any>(null)

  const completed = MOCK_DOCUMENTS.filter(d => d.status === 'completed').length
  const awaiting  = MOCK_DOCUMENTS.filter(d => d.status !== 'completed').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="e-Signature"
        description="Send, sign, and manage legally binding digital signatures on documents"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<FileText className="h-3.5 w-3.5" />}>Templates</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewDoc(true)}>Send for Signature</Button>
          </>
        }
      />

      {/* Trust banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
        <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">Legally Binding — IT Act 2000 Compliant</p>
          <p className="text-xs text-emerald-600">Every signature is timestamped, IP-logged, and stored with audit trail. Admissible as evidence under Indian law.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Documents" value={MOCK_DOCUMENTS.length.toString()} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Completed" value={completed.toString()} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Awaiting Signature" value={awaiting.toString()} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={awaiting > 0 ? { value: 'Action needed', positive: false } : undefined} />
        <StatCard label="Avg Turnaround" value="4.2 hrs" icon={<Zap className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <TabBar tabs={[
        { id: 'documents', label: 'Documents', count: MOCK_DOCUMENTS.length },
        { id: 'templates', label: 'Templates', count: MOCK_TEMPLATES.length },
      ]} active={tab} onChange={setTab} />

      {tab === 'documents' && (
        <div className="space-y-3">
          {MOCK_DOCUMENTS.map(doc => (
            <Card key={doc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewDoc(doc)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <PenTool className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800">{doc.title}</p>
                      <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Template: {doc.template} · Created {doc.created} · Expires {doc.expires}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {doc.signers.map((signer, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Badge variant={SIGNER_VARIANT[signer.status]}>
                            <span className="flex items-center gap-1">
                              {signer.status === 'signed' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                              {signer.name}
                            </span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" title="Preview" onClick={e => { e.stopPropagation(); setViewDoc(doc) }}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" title="Download" onClick={e => e.stopPropagation()}><Download className="h-3.5 w-3.5" /></Button>
                  {doc.status !== 'completed' && (
                    <Button variant="ghost" size="icon" title="Send Reminder" onClick={e => e.stopPropagation()}><Send className="h-3.5 w-3.5 text-blue-600" /></Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {MOCK_TEMPLATES.map(t => (
            <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-20 bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg mb-3 flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.fields} signature fields · Used {t.used}×</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs">Use</Button>
                <Button variant="ghost" size="sm" className="text-xs"><Copy className="h-3 w-3" /></Button>
              </div>
            </Card>
          ))}
          <Card className="border-dashed border-2 border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 min-h-[160px]">
            <div className="text-center"><Plus className="h-6 w-6 text-slate-400 mx-auto mb-1" /><p className="text-sm font-medium text-slate-500">New Template</p></div>
          </Card>
        </div>
      )}

      {viewDoc && (
        <Modal open={!!viewDoc} onClose={() => setViewDoc(null)} title={viewDoc.title} size="lg"
          footer={<>
            {viewDoc.status !== 'completed' && <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Send Reminder</Button>}
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Download Signed Copy</Button>
            <Button variant="ghost" size="sm" onClick={() => setViewDoc(null)}>Close</Button>
          </>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['Template', viewDoc.template], ['Created', viewDoc.created], ['Expires', viewDoc.expires]].map(([l, v]) => (
                <div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>
              ))}
            </div>
            <Divider label="Signers Status" />
            <div className="space-y-3">
              {viewDoc.signers.map((signer: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${signer.status === 'signed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {signer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{signer.name}</p>
                      {signer.at && <p className="text-[10px] text-slate-400">Signed at {signer.at}</p>}
                    </div>
                  </div>
                  <Badge variant={SIGNER_VARIANT[signer.status]}>{signer.status}</Badge>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-900 rounded-xl flex items-center justify-center h-40">
              <div className="text-center text-white">
                <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium opacity-70">Document Preview</p>
                <p className="text-xs opacity-40">Click to open in viewer</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={newDoc} onClose={() => setNewDoc(false)} title="Send Document for Signature" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewDoc(false)}>Cancel</Button><Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Send Now</Button></>}
      >
        <div className="space-y-4">
          <Select label="Document Template" options={MOCK_TEMPLATES.map(t => ({ label: t.name, value: t.id }))} />
          <Input label="Document Title *" required placeholder="e.g. Employment Agreement — John Doe" />
          <Input label="Expires On" type="date" />
          <Divider label="Add Signers (in order)" />
          {[0, 1].map(i => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <Input label={`Signer ${i+1} — Name`} placeholder="Full name" />
              <Input label={`Signer ${i+1} — Email`} type="email" placeholder="email@example.com" />
            </div>
          ))}
          <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Another Signer</Button>
          <Textarea label="Message to Signers" rows={2} placeholder="Please review and sign the attached agreement..." />
        </div>
      </Modal>
    </div>
  )
}
