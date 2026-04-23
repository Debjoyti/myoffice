import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
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
    const { type, user_id, email } = await req.json()

    if (!email) {
      throw new Error('Email address is required')
    }

    let subject = ''
    let html = ''

    if (type === 'welcome') {
      subject = 'Welcome to PRSK!'
      html = `
        <h1>Welcome to PRSK!</h1>
        <p>We're excited to have you on board. Let us know if you have any questions.</p>
      `
    } else {
      subject = 'Notification from PRSK'
      html = `<p>You have a new notification.</p>`
    }

    // Call Resend API
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Acme <onboarding@resend.dev>', // In production, use your verified domain
        to: [email],
        subject: subject,
        html: html,
      }),
    })

    const data = await resendRes.json()

    if (!resendRes.ok) {
      throw new Error(data.message || 'Error sending email via Resend')
    }

    // Log the email to the database
    if (user_id) {
      await supabase.from('email_logs').insert({
        user_id: user_id,
        email_type: type || 'general',
        recipient: email,
        resend_id: data.id,
        status: 'sent'
      })
    }

    return new Response(JSON.stringify(data), {
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
