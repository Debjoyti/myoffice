// Supabase Edge Function to process events async
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { event_name, payload } = await req.json()

  if (event_name === 'PayrollProcessed') {
    // Generate payslip and email
    console.log(`Processing payslip for payroll ${payload.payroll_id}`)
  } else if (event_name === 'PaymentMade') {
    // Trigger GL entry creation async
    console.log(`Payment made for invoice ${payload.invoice_id}`)
  }

  const data = {
    message: `Processed event ${event_name}`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
