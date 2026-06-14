'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Textarea
} from '@/components/ui'
import {
  Calendar, Plus, Copy, Eye, Edit2, Clock, CheckCircle2,
  MapPin, Video, Link, Settings
} from 'lucide-react'

const MOCK_SERVICES = [
  { id: 's1', name: '1:1 Introductory Call', duration: 30, type: 'video', buffer: 10, slots_today: 4, total_booked: 48, color: '#3b82f6' },
  { id: 's2', name: 'Product Demo', duration: 45, type: 'video', buffer: 15, slots_today: 2, total_booked: 32, color: '#10b981' },
  { id: 's3', name: 'HR Interview — Round 1', duration: 60, type: 'video', buffer: 15, slots_today: 3, total_booked: 24, color: '#8b5cf6' },
  { id: 's4', name: 'Technical Interview', duration: 90, type: 'video', buffer: 15, slots_today: 1, total_booked: 18, color: '#f59e0b' },
  { id: 's5', name: 'Site Visit — Factory Tour', duration: 120, type: 'in_person', buffer: 30, slots_today: 1, total_booked: 8, color: '#ef4444' },
]

const MOCK_UPCOMING = [
  { id: 'b1', service: '1:1 Introductory Call', guest: 'Vikram Kapoor', guest_email: 'v.kapoor@infosys.com', date: '2026-06-02', time: '10:00 AM', duration: 30, type: 'video', status: 'confirmed', meeting_link: 'https://meet.prsk.io/abc123' },
  { id: 'b2', service: 'Product Demo', guest: 'Anita Shah', guest_email: 'anita@wipro.com', date: '2026-06-02', time: '2:00 PM', duration: 45, type: 'video', status: 'confirmed', meeting_link: 'https://meet.prsk.io/def456' },
  { id: 'b3', service: 'HR Interview — Round 1', guest: 'Rajan Patel', guest_email: 'rajan.p@gmail.com', date: '2026-06-03', time: '11:00 AM', duration: 60, type: 'video', status: 'confirmed', meeting_link: 'https://meet.prsk.io/ghi789' },
  { id: 'b4', service: 'Technical Interview', guest: 'Meera Nair', guest_email: 'meera.n@gmail.com', date: '2026-06-03', time: '3:30 PM', duration: 90, type: 'video', status: 'pending', meeting_link: null },
  { id: 'b5', service: 'Site Visit — Factory Tour', guest: 'TCS Procurement Team', guest_email: 'procurement@tcs.com', date: '2026-06-05', time: '10:00 AM', duration: 120, type: 'in_person', status: 'confirmed', meeting_link: null },
]

const STATUS_VARIANT: Record<string, any> = { confirmed: 'success', pending: 'warning', cancelled: 'danger', completed: 'neutral' }

export default function BookingsPage() {
  const [tab, setTab] = useState('upcoming')
  const [newService, setNewService] = useState(false)
  const [viewBooking, setViewBooking] = useState<any>(null)

  const todayCount  = MOCK_UPCOMING.filter(b => b.date === '2026-06-02').length
  const totalBooked = MOCK_SERVICES.reduce((s, sv) => s + sv.total_booked, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Bookings & Scheduling"
        description="Share booking links — let candidates, clients, and partners schedule meetings at their convenience"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Link className="h-3.5 w-3.5" />}>My Booking Page</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewService(true)}>New Service</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Today's Bookings" value={todayCount.toString()} icon={<Calendar className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Bookings (All Time)" value={totalBooked.toString()} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Active Services" value={MOCK_SERVICES.length.toString()} icon={<Settings className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Avg Lead Time" value="1.8 days" icon={<Clock className="h-4 w-4" />} />
      </div>

      <TabBar tabs={[
        { id: 'upcoming', label: 'Upcoming', count: MOCK_UPCOMING.filter(b => b.status === 'confirmed').length },
        { id: 'services', label: 'Booking Services', count: MOCK_SERVICES.length },
        { id: 'calendar', label: 'Calendar View' },
      ]} active={tab} onChange={setTab} />

      {tab === 'upcoming' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Upcoming Appointments</p>
          </div>
          <Table>
            <Thead><tr><Th>Service</Th><Th>Guest</Th><Th>Date & Time</Th><Th>Duration</Th><Th>Type</Th><Th>Meeting Link</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_UPCOMING.map(b => (
                <Tr key={b.id}>
                  <Td><span className="font-medium text-slate-800">{b.service}</span></Td>
                  <Td>
                    <p className="font-medium text-slate-800">{b.guest}</p>
                    <p className="text-[10px] text-slate-400">{b.guest_email}</p>
                  </Td>
                  <Td>
                    <p className="font-semibold text-slate-800">{b.time}</p>
                    <p className="text-xs text-slate-400">{b.date}</p>
                  </Td>
                  <Td><span className="text-sm">{b.duration} min</span></Td>
                  <Td>
                    <Badge variant={b.type === 'video' ? 'info' : 'neutral'}>
                      <span className="flex items-center gap-1">
                        {b.type === 'video' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {b.type}
                      </span>
                    </Badge>
                  </Td>
                  <Td>
                    {b.meeting_link ? (
                      <Button variant="ghost" size="sm" className="text-blue-600 text-xs" leftIcon={<Link className="h-3 w-3" />}>Join</Button>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </Td>
                  <Td><Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewBooking(b)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-xs text-red-500">Cancel</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'services' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_SERVICES.map(sv => (
            <Card key={sv.id}>
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: sv.color + '20' }}>
                  <Calendar className="h-5 w-5" style={{ color: sv.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{sv.name}</p>
                  <p className="text-xs text-slate-500">{sv.duration} min · {sv.buffer} min buffer · {sv.type}</p>
                </div>
              </div>
              <div className="flex gap-3 text-center text-sm">
                <div className="flex-1 bg-slate-50 rounded p-2"><p className="text-xs text-slate-400">Today</p><p className="font-bold">{sv.slots_today}</p></div>
                <div className="flex-1 bg-slate-50 rounded p-2"><p className="text-xs text-slate-400">Total</p><p className="font-bold">{sv.total_booked}</p></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs" leftIcon={<Copy className="h-3 w-3" />}>Copy Link</Button>
                <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
              </div>
            </Card>
          ))}
          <Card className="border-dashed border-2 border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 min-h-[150px]" onClick={() => setNewService(true)}>
            <div className="text-center"><Plus className="h-6 w-6 text-slate-400 mx-auto mb-1" /><p className="text-sm font-medium text-slate-500">New Service</p></div>
          </Card>
        </div>
      )}

      {tab === 'calendar' && (
        <Card>
          <CardHeader title="Calendar View" description="June 2026" />
          <div className="grid grid-cols-7 gap-1 mt-4">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-slate-400 pb-2">{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 0 // offset for June 2026 starts Monday
              const date = day + 1
              const hasBooking = [2,3,5,8,9,10].includes(date)
              return (
                <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer transition-colors
                  ${date >= 1 && date <= 30 ? 'hover:bg-blue-50' : 'opacity-0 pointer-events-none'}
                  ${date === 1 ? 'bg-blue-600 text-white font-bold' : 'text-slate-700'}
                `}>
                  {date >= 1 && date <= 30 && (
                    <>
                      <span className="font-medium">{date}</span>
                      {hasBooking && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${date === 1 ? 'bg-white' : 'bg-blue-500'}`} />}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {viewBooking && (
        <Modal open={!!viewBooking} onClose={() => setViewBooking(null)} title={`Booking — ${viewBooking.service}`}
          footer={<>
            {viewBooking.meeting_link && <Button size="sm" leftIcon={<Video className="h-3.5 w-3.5" />}>Join Meeting</Button>}
            <Button variant="outline" size="sm" className="text-red-600 border-red-300">Cancel Booking</Button>
            <Button variant="ghost" size="sm" onClick={() => setViewBooking(null)}>Close</Button>
          </>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Guest', viewBooking.guest], ['Email', viewBooking.guest_email], ['Date', viewBooking.date], ['Time', viewBooking.time], ['Duration', `${viewBooking.duration} min`], ['Type', viewBooking.type]].map(([l, v]) => (
                <div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>
              ))}
            </div>
            {viewBooking.meeting_link && (
              <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-sm text-blue-700">
                <Link className="h-4 w-4 flex-shrink-0" />
                <span className="font-mono text-xs">{viewBooking.meeting_link}</span>
                <Button variant="ghost" size="sm" className="ml-auto text-blue-600"><Copy className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      <Modal open={newService} onClose={() => setNewService(false)} title="Create Booking Service" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewService(false)}>Cancel</Button><Button size="sm">Create Service</Button></>}
      >
        <div className="space-y-4">
          <Input label="Service Name *" required placeholder="e.g. 30-min Demo Call" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (minutes)" type="number" placeholder="30" />
            <Input label="Buffer Time (minutes)" type="number" placeholder="10" />
            <Select label="Meeting Type" options={[{label:'Video Call',value:'video'},{label:'In Person',value:'in_person'},{label:'Phone Call',value:'phone'}]} />
            <Input label="Max Bookings per Day" type="number" placeholder="10" />
          </div>
          <Textarea label="Description" rows={2} placeholder="What is this meeting for?" />
          <Input label="Booking Page Color" type="color" defaultValue="#3b82f6" />
        </div>
      </Modal>
    </div>
  )
}
