/**
 * GET /api/v1/procurement
 *
 * Returns purchase orders + vendors for the current company.
 * Accessible by admin and accountant roles.
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED_ROLES = new Set(['admin', 'accountant', 'hr'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED_ROLES.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const companyId = employee.company_id

  const [ordersResult, vendorsResult] = await Promise.allSettled([
    supabase
      .from('purchase_orders')
      .select(`
        id, po_number, total_amount, status, order_date, expected_delivery, created_at,
        vendor:vendors(id, name, contact_email, status)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('vendors')
      .select('id, name, contact_email, contact_phone, status, created_at')
      .eq('company_id', companyId)
      .order('name'),
  ])

  const orders = ordersResult.status === 'fulfilled' ? (ordersResult.value.data ?? []) : []
  const vendors = vendorsResult.status === 'fulfilled' ? (vendorsResult.value.data ?? []) : []

  return NextResponse.json({ orders, vendors })
}

/**
 * POST /api/v1/procurement
 * Body: { type: 'order' | 'vendor', ...fields }
 */
export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant'].includes(employee.role)) {
    return NextResponse.json({ error: 'Admin or Accountant access required' }, { status: 403 })
  }

  const body = await req.json()
  const companyId = employee.company_id

  if (body.type === 'vendor') {
    const { error, data } = await supabase
      .from('vendors')
      .insert({
        company_id: companyId,
        name: body.name,
        contact_email: body.contact_email ?? null,
        contact_phone: body.contact_phone ?? null,
        status: 'active',
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  }

  if (body.type === 'order') {
    const { error, data } = await supabase
      .from('purchase_orders')
      .insert({
        company_id: companyId,
        vendor_id: body.vendor_id,
        po_number: body.po_number,
        order_date: body.order_date ?? new Date().toISOString().split('T')[0],
        expected_delivery: body.expected_delivery ?? null,
        total_amount: Number(body.total_amount) || 0,
        status: 'draft',
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  }

  return NextResponse.json({ error: 'type must be order or vendor' }, { status: 400 })
}
