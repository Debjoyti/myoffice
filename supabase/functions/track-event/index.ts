import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const POSTHOG_API_KEY = Deno.env.get('POSTHOG_API_KEY')
const POSTHOG_HOST = Deno.env.get('POSTHOG_HOST') ?? 'https://app.posthog.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(
  SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY ?? '',
  {
    auth: {
      persistSession: false
    }
  }
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { event_name, user_id, properties } = body

    if (!event_name || !user_id) {
      throw new Error('event_name and user_id are required')
    }

    // Call PostHog API
    const posthogRes = await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: POSTHOG_API_KEY,
        event: event_name,
        distinct_id: user_id,
        properties: {
          ...properties,
          $lib: 'supabase-edge-function'
        },
      }),
    })

    if (!posthogRes.ok) {
        console.warn(`PostHog capture failed with status ${posthogRes.status}`);
    }

    // Log the event to the database
    const { error: dbError } = await supabase.from('events').insert({
      user_id: user_id,
      event_name: event_name,
      properties: properties || {}
    })

    if (dbError) {
        console.error('Error logging to supabase db:', dbError)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
