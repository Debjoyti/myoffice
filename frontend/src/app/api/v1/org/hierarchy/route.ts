import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

/**
 * GET /api/v1/org/hierarchy
 * Returns the full org tree as a nested structure.
 * Each node: { id, full_name, designation, department, avatar_url, role, reports: [...] }
 *
 * Query params:
 *   ?root_id=<uuid>   — start from a specific manager (default: company root)
 *   ?flat=true        — return flat array with parent_id instead of nested tree
 */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { searchParams } = new URL(req.url)
  const rootId = searchParams.get('root_id')
  const flat   = searchParams.get('flat') === 'true'

  // Fetch all active employees in one query
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, full_name, designation, department, department_id, manager_id, avatar_url, role, employee_code, status')
    .eq('status', 'active')
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const allEmployees = employees ?? []

  if (flat) {
    return NextResponse.json({ employees: allEmployees })
  }

  // Build tree: find root nodes (no manager_id, or specific root)
  type EmpNode = {
    id: string
    full_name: string
    designation: string
    department: string | null
    department_id: string | null
    manager_id: string | null
    avatar_url: string | null
    role: string
    employee_code: string
    reports: EmpNode[]
  }

  const nodeMap = new Map<string, EmpNode>()
  for (const e of allEmployees) {
    nodeMap.set(e.id, { ...e, reports: [] })
  }

  const roots: EmpNode[] = []

  for (const e of allEmployees) {
    const node = nodeMap.get(e.id)!
    if (rootId) {
      // Subtree mode: only collect children under the specified root
      if (e.id === rootId) roots.push(node)
    } else {
      if (!e.manager_id || !nodeMap.has(e.manager_id)) {
        // Top-level: no manager or manager not in active set
        roots.push(node)
      }
    }

    if (e.manager_id && nodeMap.has(e.manager_id)) {
      nodeMap.get(e.manager_id)!.reports.push(node)
    }
  }

  // If rootId given, return just that subtree
  if (rootId) {
    const rootNode = nodeMap.get(rootId)
    if (!rootNode) return NextResponse.json({ error: 'Root employee not found' }, { status: 404 })
    return NextResponse.json({ hierarchy: rootNode, total: allEmployees.length })
  }

  return NextResponse.json({ hierarchy: roots, total: allEmployees.length })
}
