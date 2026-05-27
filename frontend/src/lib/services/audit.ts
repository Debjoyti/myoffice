/**
 * Audit Service
 * Wraps the log_audit_event Postgres function.
 * Call from any API route after a state-changing action.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction =
  | 'create' | 'update' | 'delete'
  | 'approve' | 'reject' | 'cancel'
  | 'login' | 'logout'
  | 'run_payroll' | 'lock_payroll' | 'generate_offer'

export type AuditResource =
  | 'employee' | 'department' | 'position'
  | 'salary_structure' | 'payroll' | 'payslip'
  | 'reimbursement' | 'leave_request'
  | 'offer_letter' | 'compliance_record'
  | 'auth' | 'settings'

interface LogAuditParams {
  supabase: SupabaseClient<any>
  actorId: string
  actorEmail: string
  action: AuditAction
  resourceType: AuditResource
  resourceId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export async function logAudit({
  supabase,
  actorId,
  actorEmail,
  action,
  resourceType,
  resourceId,
  oldValues,
  newValues,
  metadata,
}: LogAuditParams): Promise<void> {
  // Fire-and-forget — never block the API response for audit writes
  void (async () => {
    try {
      await supabase.rpc('log_audit_event', {
        p_actor_id:      actorId,
        p_actor_email:   actorEmail,
        p_action:        action,
        p_resource_type: resourceType,
        p_resource_id:   resourceId ?? null,
        p_old_values:    oldValues ? JSON.stringify(oldValues) : null,
        p_new_values:    newValues ? JSON.stringify(newValues) : null,
        p_metadata:      metadata  ? JSON.stringify(metadata)  : null,
      })
    } catch { /* never throw */ }
  })()
}
