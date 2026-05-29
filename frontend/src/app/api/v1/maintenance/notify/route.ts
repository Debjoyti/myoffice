import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  maintenance_id: z.string().uuid(),
})

/** POST /api/v1/maintenance/notify — sign up for completion notification */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('maintenance_notifications')
      .insert({ email: parsed.data.email, maintenance_id: parsed.data.maintenance_id })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already signed up' }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ message: 'Signed up for notification' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/v1/maintenance/notify error:', err)
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 })
  }
}
