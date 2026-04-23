# PRSK Backend Setup Guide

This guide describes the complete, production-ready backend system using Supabase, Resend, and PostHog. The architecture is designed to be modular, scalable, and maintainable, requiring zero manual intervention for ongoing operations.

## Architecture Overview

*   **Database & Authentication:** Supabase handles core authentication (PostgreSQL with GoTrue). We've implemented strict Row-Level Security (RLS) for data isolation.
*   **Email Service:** Resend is integrated via a Supabase Edge Function (`send-email`) for transactional emails. A database trigger uses `pg_net` to automatically call this function when a new user signs up.
*   **Analytics:** PostHog is integrated via a Supabase Edge Function (`track-event`) for secure server-side tracking.
*   **Backend Logic:** Edge Functions abstract third-party API keys and maintain a unified API layer.

## Database Schema Explanation

The schema is maintained in `supabase/migrations/`.

*   `public.profiles`: Stores extended user data. A database trigger `public.handle_new_user()` automatically creates a row here whenever a new user registers in `auth.users`.
*   `public.activity_logs`: Designed to track user session and activity details.
*   `public.email_logs`: Stores a log of all transactional emails sent via the `send-email` edge function, tracking the `resend_id` and delivery `status`.
*   `public.events`: Stores structured analytics events sent via the `track-event` edge function.

All tables include standard audit fields (`created_at`, `updated_at`) and robust RLS policies.

## Environment Variables Configuration

Before deploying, ensure the following environment variables are set in your Supabase project (either via the Supabase Dashboard or `npx supabase secrets set`):

```bash
# Resend (Transactional Emails)
RESEND_API_KEY="your_resend_api_key"

# PostHog (Analytics)
POSTHOG_API_KEY="your_posthog_api_key"
POSTHOG_HOST="https://app.posthog.com" # Or your EU host

# Supabase (Injected automatically in hosted Edge Functions, but needed if testing locally)
# SUPABASE_URL="https://your-project-ref.supabase.co"
# SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

> **Note on Webhooks:** The `trigger_welcome_email()` database function uses `request.env.SUPABASE_URL` to route the HTTP request to the Edge Function. This ensures that the webhook works correctly both in local development (`http://kong:8000`) and in production without hardcoding URLs.

## Deployment Steps

To deploy this backend to your production Supabase project, follow these steps from your local machine:

1.  **Link your project:**
    ```bash
    npx supabase link --project-ref <your-project-ref>
    ```

2.  **Push the database schema:**
    ```bash
    npx supabase db push
    ```

3.  **Deploy Edge Functions:**
    ```bash
    npx supabase functions deploy send-email
    npx supabase functions deploy track-event
    ```

## API Usage Examples (Edge Functions)

### 1. Sending an Email (`/functions/v1/send-email`)

This endpoint is automatically called via a `pg_net` trigger on user signup, but it can also be called manually.

```bash
curl -i --location --request POST 'https://<your-project-ref>.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer <your-anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{"type":"welcome","user_id":"uuid-here","email":"user@example.com"}'
```

### 2. Tracking an Event (`/functions/v1/track-event`)

Use this endpoint to securely log server-side events to PostHog and your database.

```bash
curl -i --location --request POST 'https://<your-project-ref>.supabase.co/functions/v1/track-event' \
  --header 'Authorization: Bearer <your-anon-key>' \
  --header 'Content-Type: application/json' \
  --data '{"event_name":"user_upgraded","user_id":"uuid-here","properties":{"plan":"pro"}}'
```

## Extending the System

*   **New Tables:** Create new migrations (`npx supabase migration new <name>`) and deploy with `npx supabase db push`.
*   **New Edge Functions:** Run `npx supabase functions new <function_name>`, implement your logic in TypeScript, and deploy.
*   **Local Development:** Use `npx supabase start` to spin up the local Docker environment for testing.
