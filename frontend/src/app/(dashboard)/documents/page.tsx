'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Select
} from '@/components/ui'
import {
  FileText, FolderOpen, Plus, Upload, Eye, Download, Share2,
  Edit2, Star, HardDrive,
  File, Image, Sheet, Presentation
} from 'lucide-react'

const MOCK_FOLDERS = [
  { id: 'f1', name: 'HR Documents', files: 48, size: '124 MB', updated: '2026-05-30', shared: true, color: 'bg-blue-500' },
  { id: 'f2', name: 'Finance & Compliance', files: 92, size: '340 MB', updated: '2026-05-28', shared: true, color: 'bg-emerald-500' },
  { id: 'f3', name: 'Contracts & Agreements', files: 35, size: '88 MB', updated: '2026-05-25', shared: false, color: 'bg-violet-500' },
  { id: 'f4', name: 'Product Documentation', files: 64, size: '210 MB', updated: '2026-05-20', shared: true, color: 'bg-amber-500' },
  { id: 'f5', name: 'Quality & IATF Records', files: 128, size: '580 MB', updated: '2026-05-15', shared: false, color: 'bg-red-500' },
  { id: 'f6', name: 'Marketing Assets', files: 212, size: '1.2 GB', updated: '2026-05-10', shared: true, color: 'bg-pink-500' },
]

const MOCK_RECENT = [
  { id: 'd1', name: 'Q2 2026 Financial Report.pdf', type: 'pdf', folder: 'Finance & Compliance', size: '2.4 MB', updated: '2026-05-30 11:24 AM', updated_by: 'Rakesh Sharma', version: 'v3', starred: true },
  { id: 'd2', name: 'Employee Handbook 2026.docx', type: 'docx', folder: 'HR Documents', size: '1.1 MB', updated: '2026-05-28 2:10 PM', updated_by: 'Priya Patel', version: 'v8', starred: false },
  { id: 'd3', name: 'IATF Audit Checklist May 2026.xlsx', type: 'xlsx', folder: 'Quality & IATF Records', size: '840 KB', updated: '2026-05-27 9:00 AM', updated_by: 'Sunil Nair', version: 'v2', starred: true },
  { id: 'd4', name: 'Vendor Agreement — BFW India.pdf', type: 'pdf', folder: 'Contracts & Agreements', size: '380 KB', updated: '2026-05-25 4:45 PM', updated_by: 'Legal Team', version: 'v1', starred: false },
  { id: 'd5', name: 'Product Roadmap H2 2026.pptx', type: 'pptx', folder: 'Product Documentation', size: '4.2 MB', updated: '2026-05-24 3:00 PM', updated_by: 'Product Team', version: 'v5', starred: false },
]

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  pdf:  { icon: <FileText className="h-4 w-4" />, color: 'bg-red-100 text-red-600' },
  docx: { icon: <File className="h-4 w-4" />, color: 'bg-blue-100 text-blue-600' },
  xlsx: { icon: <Sheet className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-600' },
  pptx: { icon: <Presentation className="h-4 w-4" />, color: 'bg-orange-100 text-orange-600' },
  img:  { icon: <Image className="h-4 w-4" />, color: 'bg-violet-100 text-violet-600' },
}

export default function DocumentsPage() {
  const [tab, setTab] = useState('drive')
  const [search, setSearch] = useState('')
  const [upload, setUpload] = useState(false)

  const totalFiles = MOCK_FOLDERS.reduce((s, f) => s + f.files, 0)
  const totalSize  = '2.5 GB'

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Document Management"
        description="Centralised file storage, version control, sharing, and access management for your organisation"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<FolderOpen className="h-3.5 w-3.5" />}>New Folder</Button>
            <Button size="sm" leftIcon={<Upload className="h-3.5 w-3.5" />} onClick={() => setUpload(true)}>Upload Files</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Files" value={totalFiles.toString()} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Storage Used" value={totalSize} icon={<HardDrive className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" delta={{ value: '2.5 of 10 GB', positive: true }} />
        <StatCard label="Shared Folders" value={MOCK_FOLDERS.filter(f => f.shared).length.toString()} icon={<Share2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Folders" value={MOCK_FOLDERS.length.toString()} icon={<FolderOpen className="h-4 w-4" />} />
      </div>

      {/* Storage bar */}
      <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="font-medium text-slate-600">Storage: 2.5 GB of 10 GB used</span>
          <span className="text-slate-400">25%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }} />
        </div>
      </div>

      <TabBar tabs={[
        { id: 'drive', label: 'My Drive' },
        { id: 'recent', label: 'Recent' },
        { id: 'starred', label: '⭐ Starred', count: MOCK_RECENT.filter(f => f.starred).length },
        { id: 'shared', label: 'Shared with Me' },
      ]} active={tab} onChange={setTab} />

      {tab === 'drive' && (
        <div className="space-y-4">
          <SearchInput placeholder="Search files and folders..." value={search} onChange={setSearch} className="w-72" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {MOCK_FOLDERS.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase())).map(folder => (
              <Card key={folder.id} className="cursor-pointer hover:shadow-md transition-shadow p-3 text-center">
                <div className={`h-12 w-12 ${folder.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">{folder.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{folder.files} files · {folder.size}</p>
                {folder.shared && <div className="flex items-center justify-center gap-1 mt-1"><Share2 className="h-3 w-3 text-blue-400" /><span className="text-[10px] text-blue-400">Shared</span></div>}
              </Card>
            ))}
            <Card className="cursor-pointer hover:shadow-md transition-shadow p-3 text-center border-dashed border-2 border-slate-200 hover:border-blue-300">
              <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Plus className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-500">New Folder</p>
            </Card>
          </div>
        </div>
      )}

      {(tab === 'recent' || tab === 'starred' || tab === 'shared') && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">
              {tab === 'recent' ? 'Recently Modified' : tab === 'starred' ? 'Starred Files' : 'Shared with Me'}
            </p>
          </div>
          <Table>
            <Thead><tr><Th>File Name</Th><Th>Folder</Th><Th>Version</Th><Th>Size</Th><Th>Last Modified</Th><Th>Modified By</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_RECENT.filter(f => tab !== 'starred' || f.starred).map(file => {
                const meta = TYPE_ICON[file.type] ?? TYPE_ICON.pdf
                return (
                  <Tr key={file.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>{meta.icon}</div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{file.name}</p>
                        </div>
                        {file.starred && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                      </div>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{file.folder}</span></Td>
                    <Td><span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{file.version}</span></Td>
                    <Td><span className="text-xs text-slate-500">{file.size}</span></Td>
                    <Td><span className="text-xs text-slate-500">{file.updated}</span></Td>
                    <Td><span className="text-xs text-slate-500">{file.updated_by}</span></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Preview"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" title="Download"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" title="Share"><Share2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" title="More"><Edit2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      <Modal open={upload} onClose={() => setUpload(false)} title="Upload Files" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setUpload(false)}>Cancel</Button><Button size="sm">Upload</Button></>}
      >
        <div className="space-y-4">
          <Select label="Upload to Folder" options={MOCK_FOLDERS.map(f => ({ label: f.name, value: f.id }))} />
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">Drag & drop files here, or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">Max 50 MB per file · PDF, DOCX, XLSX, PPTX, Images</p>
          </div>
          <Select label="Access Level" options={[{label:'Private (only me)',value:'private'},{label:'Team (my department)',value:'team'},{label:'Company-wide',value:'company'},{label:'Custom permissions',value:'custom'}]} />
        </div>
      </Modal>
    </div>
  )
}
