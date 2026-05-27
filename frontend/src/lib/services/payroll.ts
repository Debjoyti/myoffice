/**
 * Payroll Calculation Engine
 *
 * Rules (HR override is final):
 *  - Gross = Basic + HRA + Special + Transport + Medical + LTA (prorated for LOP)
 *  - CTC   = Gross + Employer PF + Gratuity + Insurance
 *  - Net   = Gross − Employee PF − ESI (if applicable) − Professional Tax
 *  - PF    = 12% of prorated basic (statutory)
 *  - ESI   = 0.75% employee / 3.25% employer (only if gross ≤ ₹21,000)
 *  - PT    = ₹200/month if gross > ₹10,000 (Maharashtra)
 *  - Reimbursements are OUTSIDE CTC, taxed separately, not included in net
 *  - Payroll is LOCKED after finalization — no edits allowed
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PayslipCalculation {
  salary_structure_id: string
  working_days: number
  paid_days: number
  loss_of_pay_days: number
  basic_paid: number
  hra_paid: number
  special_allowance_paid: number
  transport_allowance_paid: number
  medical_allowance_paid: number
  lta_paid: number
  pf_employee_deduction: number
  esi_employee_deduction: number
  professional_tax_deduction: number
  gross_earnings: number
  total_deductions: number
  net_salary: number
  pf_employer: number
  esi_employer: number
  esi_applicable: boolean
  error?: string
}

export interface PayrollRunResult {
  payroll_id: string
  payroll_month: string
  total_employees: number
  total_gross: number
  total_net: number
  total_deductions: number
  payslips_generated: number
  skipped: { employee_id: string; reason: string }[]
}

/**
 * Uses the DB calculate_payslip() function for each employee
 * to ensure consistent, DB-authoritative calculation.
 */
export async function calculatePayslip(
  supabase: SupabaseClient<any>,
  employeeId: string,
  month: string            // 'YYYY-MM'
): Promise<PayslipCalculation> {
  const { data, error } = await supabase.rpc('calculate_payslip', {
    p_employee_id: employeeId,
    p_month: month,
  })
  if (error) throw new Error(error.message)
  return data as PayslipCalculation
}

/**
 * Runs payroll for ALL active employees for a given month.
 * Idempotent: skips employees who already have a finalized payslip for that month.
 * Locks payroll after completion.
 */
export async function runPayroll(
  supabase: SupabaseClient<any>,
  month: string,            // 'YYYY-MM'
  processedBy: string,      // actor employee id
  notes?: string
): Promise<PayrollRunResult> {

  // ── Guard: already locked? ──────────────────────────────────
  const { data: existing } = await supabase
    .from('payrolls')
    .select('id, status')
    .eq('payroll_month', month)
    .maybeSingle()

  if (existing?.status === 'locked') {
    throw new Error(`Payroll for ${month} is already locked and cannot be re-run.`)
  }

  // ── Create or update payroll header ────────────────────────
  let payrollId: string
  if (existing) {
    payrollId = existing.id
    await supabase.from('payrolls').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', payrollId)
  } else {
    const { data: newPayroll, error } = await supabase
      .from('payrolls')
      .insert({ payroll_month: month, status: 'processing', notes: notes ?? null, processed_by: processedBy })
      .select('id').single()
    if (error || !newPayroll) throw new Error(error?.message ?? 'Failed to create payroll')
    payrollId = newPayroll.id
  }

  // ── Fetch all active employees with salary structures ──────
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, employee_code, full_name, email')
    .eq('status', 'active')

  if (empErr) throw new Error(empErr.message)
  const empList = employees ?? []

  const skipped: { employee_id: string; reason: string }[] = []
  let totalGross = 0, totalNet = 0, totalDeductions = 0, generated = 0

  for (const emp of empList) {
    // Skip if finalized payslip already exists
    const { data: existingSlip } = await supabase
      .from('payslips')
      .select('id, status')
      .eq('employee_id', emp.id)
      .eq('payroll_month', month)
      .maybeSingle()

    if (existingSlip?.status === 'finalized' || existingSlip?.status === 'paid') {
      skipped.push({ employee_id: emp.id, reason: 'Already finalized' })
      continue
    }

    // Calculate via DB function
    let calc: PayslipCalculation
    try {
      calc = await calculatePayslip(supabase, emp.id, month)
      if (calc.error) {
        skipped.push({ employee_id: emp.id, reason: calc.error })
        continue
      }
    } catch (e: any) {
      skipped.push({ employee_id: emp.id, reason: e.message })
      continue
    }

    // Get approved reimbursements for this month
    const { data: reimbs } = await supabase
      .from('reimbursements')
      .select('amount')
      .eq('employee_id', emp.id)
      .eq('claim_month', month)
      .in('status', ['approved', 'paid'])
    const reimbTotal = (reimbs ?? []).reduce((s, r) => s + Number(r.amount), 0)

    const payslipData = {
      employee_id:                  emp.id,
      payroll_id:                   payrollId,
      salary_structure_id:          calc.salary_structure_id,
      payroll_month:                month,
      working_days:                 calc.working_days,
      paid_days:                    calc.paid_days,
      loss_of_pay_days:             calc.loss_of_pay_days,
      basic_paid:                   calc.basic_paid,
      hra_paid:                     calc.hra_paid,
      special_allowance_paid:       calc.special_allowance_paid,
      transport_allowance_paid:     calc.transport_allowance_paid,
      medical_allowance_paid:       calc.medical_allowance_paid,
      lta_paid:                     calc.lta_paid,
      pf_employee_deduction:        calc.pf_employee_deduction,
      esi_employee_deduction:       calc.esi_employee_deduction,
      professional_tax_deduction:   calc.professional_tax_deduction,
      gross_earnings:               calc.gross_earnings,
      total_deductions:             calc.total_deductions,
      net_salary:                   calc.net_salary,
      reimbursements_paid:          reimbTotal,
      status:                       'generated',
      generated_at:                 new Date().toISOString(),
    }

    if (existingSlip) {
      await supabase.from('payslips').update(payslipData).eq('id', existingSlip.id)
    } else {
      await supabase.from('payslips').insert(payslipData)
    }

    // Insert compliance record (upsert)
    await supabase.from('compliance_records').upsert({
      employee_id:     emp.id,
      record_month:    month,
      pf_employee:     calc.pf_employee_deduction,
      pf_employer:     calc.pf_employer,
      esi_employee:    calc.esi_employee_deduction,
      esi_employer:    calc.esi_employer,
      esi_applicable:  calc.esi_applicable,
      professional_tax: calc.professional_tax_deduction,
    }, { onConflict: 'employee_id,record_month' })

    totalGross      += Number(calc.gross_earnings)
    totalNet        += Number(calc.net_salary)
    totalDeductions += Number(calc.total_deductions)
    generated++
  }

  // ── Update payroll header with totals ───────────────────────
  await supabase.from('payrolls').update({
    status:           'completed',
    total_employees:  generated,
    total_gross:      Math.round(totalGross * 100) / 100,
    total_net:        Math.round(totalNet * 100) / 100,
    total_deductions: Math.round(totalDeductions * 100) / 100,
    processed_by:     processedBy,
    processed_at:     new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  }).eq('id', payrollId)

  return {
    payroll_id:          payrollId,
    payroll_month:       month,
    total_employees:     generated,
    total_gross:         Math.round(totalGross * 100) / 100,
    total_net:           Math.round(totalNet * 100) / 100,
    total_deductions:    Math.round(totalDeductions * 100) / 100,
    payslips_generated:  generated,
    skipped,
  }
}

/**
 * Lock a completed payroll — prevents any further edits.
 * Only callable by HR/Admin.
 */
export async function lockPayroll(
  supabase: SupabaseClient<any>,
  payrollId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('payrolls')
    .select('status')
    .eq('id', payrollId)
    .single()

  if (error || !data) throw new Error('Payroll not found')
  if (data.status === 'locked') throw new Error('Already locked')
  if (data.status !== 'completed') throw new Error('Can only lock a completed payroll')

  await supabase.from('payrolls').update({
    status:     'locked',
    locked_at:  new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', payrollId)

  // Mark all payslips as finalized
  await supabase.from('payslips').update({ status: 'finalized', finalized_at: new Date().toISOString() })
    .eq('payroll_id', payrollId)
    .eq('status', 'generated')
}
