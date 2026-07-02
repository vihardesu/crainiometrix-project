-- AI mode schema for Crainiometrix MVP

-- Navigator settings: persisted AI mode toggle per navigator
create table public.navigator_settings (
  navigator_id uuid primary key references public.profiles (id) on delete cascade,
  ai_mode_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Agent actions: audit trail for each processed inbound message
create table public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  navigator_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  trigger_message_id uuid not null references public.messages (id) on delete cascade,
  status text not null check (status in ('processing', 'completed', 'failed')),
  category text check (category in ('Scheduling', 'Clinical', 'Referral', 'Non-Clinical', 'Transportation')),
  urgency text check (urgency in ('Urgent', 'Non-Urgent')),
  decision text check (decision in ('AI', 'Human', 'Escalate', 'Indeterminate')),
  summary text,
  response_message_id uuid references public.messages (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index agent_actions_navigator_status_idx on public.agent_actions (navigator_id, status);
create index agent_actions_trigger_message_idx on public.agent_actions (trigger_message_id);
create index agent_actions_conversation_idx on public.agent_actions (conversation_id);

-- Extend messages with AI attribution
alter table public.messages
  add column is_ai_generated boolean not null default false;

-- Seed navigator settings for Alex Navigator
insert into public.navigator_settings (navigator_id, ai_mode_enabled)
values ('a0000001-0000-4000-8000-000000000001', false);

-- RLS
alter table public.navigator_settings enable row level security;
alter table public.agent_actions enable row level security;

create policy "navigator_settings_select_anon"
  on public.navigator_settings
  for select
  to anon, authenticated
  using (true);

create policy "agent_actions_select_anon"
  on public.agent_actions
  for select
  to anon, authenticated
  using (true);

-- Realtime
alter publication supabase_realtime add table public.navigator_settings;
alter publication supabase_realtime add table public.agent_actions;
