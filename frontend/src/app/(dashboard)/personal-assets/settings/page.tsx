'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, Button, Badge, Input, Alert, EmptyState } from '@/components/ui'
import {
  MapPin, Tag, Plus, Pencil, Trash2, CheckCircle2, X, Shield,
  Home, Package, Car, Lock, RefreshCw
} from 'lucide-react'

type Category = {
  id: string; category_name: string; default_depreciation_rate: number
  default_insurance_rate: number; typical_lifespan_years?: number
}

type Location = {
  id: string; location_name: string; location_type: string
  security_level: string; address?: string; notes?: string
}

const LOCATION_TYPE_ICONS: Record<string, React.ElementType> = {
  room: Home, building: Package, storage_unit: Package,
  safe: Lock, vehicle: Car, other: MapPin,
}

const SECURITY_COLORS: Record<string, string> = {
  low: 'text-slate-500', medium: 'text-blue-500', high: 'text-amber-500', vault: 'text-red-500',
}

export default function SettingsPage() {
  const [tab, setTab]               = useState<'locations'|'categories'>('locations')
  const [locations, setLocations]   = useState<Location[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)

  // Location form
  const [locForm, setLocForm] = useState({
    location_name: '', location_type: 'room', security_level: 'medium', address: '', notes: '',
  })
  const [showLocForm, setShowLocForm] = useState(false)

  async function load() {
    setLoading(true)
    const [locRes, catRes] = await Promise.all([
      fetch('/api/v1/personal-assets/locations'),
      fetch('/api/v1/personal-assets/categories'),
    ])
    if (locRes.ok) setLocations(await locRes.json())
    if (catRes.ok) setCategories(await catRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addLocation() {
    if (!locForm.location_name.trim()) { setError('Location name is required'); return }
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/v1/personal-assets/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locForm),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to add location'); setSaving(false); return }
    setLocations(prev => [...prev, data])
    setLocForm({ location_name: '', location_type: 'room', security_level: 'medium', address: '', notes: '' })
    setShowLocForm(false)
    setSuccess('Location added successfully')
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  async function deleteLocation(id: string) {
    if (!confirm('Delete this location? Assets stored here will become unassigned.')) return
    setDeleting(id)
    const res = await fetch('/api/v1/personal-assets/locations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to delete'); }
    else setLocations(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-base font-bold text-slate-800">Settings</h1>
        <p className="text-xs text-slate-500">Manage your locations, categories, and preferences</p>
      </div>

      {error   && <Alert variant="danger">{error}</Alert>}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['locations','categories'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 capitalize transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Locations */}
      {tab === 'locations' && !loading && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Storage Locations"
              description="Where your assets are physically stored"
              action={
                <Button size="sm" leftIcon={<Plus className="h-3 w-3" />} onClick={() => { setShowLocForm(true); setError('') }}>
                  Add Location
                </Button>
              }
            />

            {/* Add form */}
            {showLocForm && (
              <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-indigo-700">New Location</p>
                  <button onClick={() => setShowLocForm(false)}><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <Input
                  label="Location Name *"
                  placeholder="e.g. Master Bedroom, Office Desk, Garage"
                  value={locForm.location_name}
                  onChange={e => setLocForm(f => ({ ...f, location_name: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                    <select
                      className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={locForm.location_type}
                      onChange={e => setLocForm(f => ({ ...f, location_type: e.target.value }))}
                    >
                      <option value="room">Room</option>
                      <option value="building">Building</option>
                      <option value="storage_unit">Storage Unit</option>
                      <option value="safe">Safe</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Security Level</label>
                    <select
                      className="w-full h-8 px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      value={locForm.security_level}
                      onChange={e => setLocForm(f => ({ ...f, security_level: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="vault">Vault</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Address (optional)"
                  placeholder="Physical address if applicable"
                  value={locForm.address}
                  onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))}
                />
                <div className="flex gap-2 pt-1">
                  <Button size="sm" loading={saving} onClick={addLocation}>Add Location</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowLocForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {locations.length === 0 ? (
              <EmptyState
                icon={<MapPin className="h-6 w-6" />}
                title="No locations yet"
                description="Add locations to track where your assets are stored."
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {locations.map(loc => {
                  const Icon = LOCATION_TYPE_ICONS[loc.location_type] ?? MapPin
                  return (
                    <div key={loc.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{loc.location_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 capitalize">{loc.location_type.replace('_', ' ')}</span>
                          <Shield className={`h-2.5 w-2.5 ${SECURITY_COLORS[loc.security_level]}`} />
                          <span className={`text-[10px] capitalize ${SECURITY_COLORS[loc.security_level]}`}>
                            {loc.security_level}
                          </span>
                        </div>
                        {loc.address && <p className="text-[10px] text-slate-400 truncate mt-0.5">{loc.address}</p>}
                      </div>
                      <button
                        onClick={() => deleteLocation(loc.id)}
                        disabled={deleting === loc.id}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        {deleting === loc.id
                          ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && !loading && (
        <Card>
          <CardHeader
            title="Asset Categories"
            description="Default depreciation rates and settings per category"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Category','Default Depr. Rate','Insurance Rate','Lifespan'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center">
                          <Tag className="h-3 w-3 text-indigo-500" />
                        </div>
                        <span className="font-semibold text-slate-700">{c.category_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={c.default_depreciation_rate === 0 ? 'neutral' : 'info'} size="sm">
                        {c.default_depreciation_rate}% / yr
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {c.default_insurance_rate}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {c.typical_lifespan_years ? `${c.typical_lifespan_years} yrs` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 px-3 pb-2">
            Default rates are applied automatically when you add a new asset and select a category.
          </p>
        </Card>
      )}
    </div>
  )
}
