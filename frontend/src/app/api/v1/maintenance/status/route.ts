import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { createClient } from '@/lib/supabase/server'

/** GET /api/v1/maintenance/status — returns active maintenance or null */
export async function GET() {
  try {
    // Public endpoint: use service role to allow unauthenticated reads
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('maintenance_state')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    return NextResponse.json({ maintenance: data })
  } catch (err) {
    console.error('GET /api/v1/maintenance/status error:', err)
    return NextResponse.json({ maintenance: null })
  }
}
