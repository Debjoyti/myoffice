-- Enable pg_net for edge function webhooks
create extension if not exists "pg_net" with schema extensions;

-- ==========================================
-- 1. PROFILES
-- ==========================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  first_name text,
  last_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Automatically create a profile on signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 2. ACTIVITY LOGS (SESSIONS)
-- ==========================================
create table public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index activity_logs_user_id_idx on public.activity_logs(user_id);
create index activity_logs_action_idx on public.activity_logs(action);

alter table public.activity_logs enable row level security;

create policy "Users can view their own activity logs."
  on public.activity_logs for select
  using ( auth.uid() = user_id );

-- Users should not be able to insert/update/delete their own logs directly via API,
-- but for backend processes or edge functions using a service role, it will bypass RLS.

-- ==========================================
-- 3. EMAIL LOGS
-- ==========================================
create table public.email_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email_type text not null,
  recipient text not null,
  resend_id text,
  status text not null default 'pending',
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index email_logs_user_id_idx on public.email_logs(user_id);
create index email_logs_status_idx on public.email_logs(status);

alter table public.email_logs enable row level security;

-- Users can view their own email logs, maybe.
create policy "Users can view their own email logs."
  on public.email_logs for select
  using ( auth.uid() = user_id );

-- ==========================================
-- 4. EVENTS (ANALYTICS)
-- ==========================================
create table public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index events_user_id_idx on public.events(user_id);
create index events_name_idx on public.events(event_name);

alter table public.events enable row level security;

create policy "Users can insert events"
  on public.events for insert
  with check ( auth.uid() = user_id );

create policy "Users can view their own events"
  on public.events for select
  using ( auth.uid() = user_id );


-- ==========================================
-- Webhook via pg_net to trigger welcome email
-- ==========================================

create or replace function public.trigger_welcome_email()
returns trigger as $$
declare
  request_id bigint;
  webhook_url text;
  anon_key text;
begin
  -- In a real environment, you'd store the URL and keys in Vault or fetch them from settings.
  -- Since we cannot easily access env vars dynamically in standard Supabase triggers without pg_vault
  -- or setting custom configurations, we'll construct the local edge function URL.
  -- Note: In production, the Project Reference is used. For local development, it's typically the kong API port.

  -- Use dynamic project URL for webhook.
  webhook_url := coalesce(current_setting('request.env.SUPABASE_URL', true), 'http://kong:8000') || '/functions/v1/send-email';

  -- Fetch service role key for webhook authentication if possible, otherwise it will just be called directly
  anon_key := coalesce(current_setting('request.env.SUPABASE_SERVICE_ROLE_KEY', true), 'your-service-role-key');

  select
    net.http_post(
        url := webhook_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
            'type', 'welcome',
            'user_id', new.id,
            'email', new.email
        )
    )
  into request_id;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger runs after the profile is created (which happens after auth.user is created)
create trigger on_profile_created_send_email
  after insert on public.profiles
  for each row execute procedure public.trigger_welcome_email();
