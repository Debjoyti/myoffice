import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: structure, error } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('is_active', true)
    .is('effective_to', null)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!structure) return NextResponse.json({ structure: null }, { status: 200 })

  // ── Compute derived totals ───────────────────────────────────
  const earnings = {
    basic: structure.basic,
    hra: structure.hra,
    special_allowance: structure.special_allowance,
    transport_allowance: structure.transport_allowance,
    medical_allowance: structure.medical_allowance,
    lta_monthly: structure.lta_monthly,
    total:
      structure.basic +
      structure.hra +
      structure.special_allowance +
      structure.transport_allowance +
      structure.medical_allowance +
      structure.lta_monthly,
  }

  const benefits = {
    pf_employer: structure.pf_employer,
    gratuity_monthly: structure.gratuity_monthly,
    insurance_monthly: structure.insurance_monthly,
    total: structure.pf_employer + structure.gratuity_monthly + structure.insurance_monthly,
  }

  const deductions = {
    pf_employee: structure.pf_employee,
    esi_employee: structure.esi_employee,
    professional_tax: structure.professional_tax,
    total: structure.pf_employee + structure.esi_employee + structure.professional_tax,
  }

  const ctc_annual = structure.ctc_monthly * 12
  const gross_monthly = earnings.total                  // what employee receives before deductions
  const net_monthly = gross_monthly - deductions.total  // take-home

  // ── Breakdown for donut chart ────────────────────────────────
  const breakdown = [
    {
      label: 'Earnings',
      value: earnings.total,
      pct: Math.round((earnings.total / structure.ctc_monthly) * 100),
      color: '#6366f1',
    },
    {
      label: 'Benefits',
      value: benefits.total,
      pct: Math.round((benefits.total / structure.ctc_monthly) * 100),
      color: '#10b981',
    },
    {
      label: 'Deductions',
      value: deductions.total,
      pct: Math.round((deductions.total / gross_monthly) * 100),
      color: '#f59e0b',
    },
  ]

  return NextResponse.json({
    structure: {
      ...structure,
      ctc_annual,
      gross_monthly,
      net_monthly,
      earnings,
      benefits,
      deductions,
      breakdown,
    },
  })
}
