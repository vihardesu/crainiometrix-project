-- Messaging schema for Crainiometrix MVP

-- Profiles: navigators, patients, caregivers
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  full_name text not null,
  role text not null check (role in ('navigator', 'patient', 'caregiver')),
  patient_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_patient_id_idx on public.profiles (patient_id);

-- Conversations: one thread per navigator + participant pair
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  navigator_id uuid not null references public.profiles (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz,
  last_message_body text,
  unread_count integer not null default 0,
  is_escalated boolean not null default false,
  created_at timestamptz not null default now(),
  unique (navigator_id, participant_id)
);

create index conversations_navigator_id_idx on public.conversations (navigator_id);
create index conversations_last_message_at_idx on public.conversations (last_message_at desc nulls last);

-- Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_role text not null check (sender_role in ('navigator', 'patient', 'caregiver')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

-- Keep conversation metadata in sync when messages are inserted
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_body = new.body,
    unread_count = case
      when new.sender_role != 'navigator' then unread_count + 1
      else unread_count
    end
  where id = new.conversation_id;

  return new;
end;
$$;

create trigger on_message_insert
  after insert on public.messages
  for each row
  execute function public.handle_new_message();

-- RLS
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "profiles_select_anon"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "conversations_select_anon"
  on public.conversations
  for select
  to anon, authenticated
  using (true);

create policy "messages_select_anon"
  on public.messages
  for select
  to anon, authenticated
  using (true);

-- Realtime
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

-- Seed profiles
insert into public.profiles (id, external_id, full_name, role, patient_id) values
  ('a0000001-0000-4000-8000-000000000001', 'nav-1', 'Alex Navigator', 'navigator', null),
  ('a0000001-0000-4000-8000-000000000011', null, 'Margaret Chen', 'patient', null),
  ('a0000001-0000-4000-8000-000000000012', null, 'James Okafor', 'patient', null),
  ('a0000001-0000-4000-8000-000000000013', null, 'Ruth Patel', 'patient', null),
  ('a0000001-0000-4000-8000-000000000021', null, 'Sarah Chen', 'caregiver', 'a0000001-0000-4000-8000-000000000011'),
  ('a0000001-0000-4000-8000-000000000022', null, 'Michael Chen', 'caregiver', 'a0000001-0000-4000-8000-000000000011'),
  ('a0000001-0000-4000-8000-000000000023', null, 'Anita Okafor', 'caregiver', 'a0000001-0000-4000-8000-000000000012'),
  ('a0000001-0000-4000-8000-000000000024', null, 'David Patel', 'caregiver', 'a0000001-0000-4000-8000-000000000013');

-- Seed conversations
insert into public.conversations (id, navigator_id, participant_id, last_message_at, last_message_body, unread_count) values
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000021', now() - interval '10 minutes', 'She seemed confused about her medication schedule today.', 2),
  ('b0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000012', now() - interval '2 hours', 'Thank you for the referral information.', 0),
  ('b0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000024', now() - interval '30 minutes', 'Can we schedule a check-in call this week?', 1);

-- Seed messages (conv 1: Sarah Chen - unread)
insert into public.messages (conversation_id, sender_id, sender_role, body, read_at, created_at) values
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000021', 'caregiver', 'Hi Alex, Mom had a rough morning.', now() - interval '2 days', now() - interval '2 days'),
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'navigator', 'I''m sorry to hear that. What happened?', now() - interval '2 days', now() - interval '2 days'),
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000021', 'caregiver', 'She seemed confused about her medication schedule today.', null, now() - interval '10 minutes'),
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000021', 'caregiver', 'Should I set up a pill organizer?', null, now() - interval '5 minutes');

-- Reset unread_count for conv1 since trigger would have incremented on seed inserts
-- The trigger ran on insert, so unread_count may be higher than intended. Fix manually:
update public.conversations set unread_count = 2 where id = 'b0000001-0000-4000-8000-000000000001';

-- Seed messages (conv 2: James Okafor - read)
insert into public.messages (conversation_id, sender_id, sender_role, body, read_at, created_at) values
  ('b0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000012', 'patient', 'I need help finding a memory care specialist.', now() - interval '3 hours', now() - interval '3 hours'),
  ('b0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001', 'navigator', 'I can send you a list of specialists in your area.', now() - interval '2 hours', now() - interval '2 hours'),
  ('b0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000012', 'patient', 'Thank you for the referral information.', now() - interval '2 hours', now() - interval '2 hours');

update public.conversations set unread_count = 0 where id = 'b0000001-0000-4000-8000-000000000002';

-- Seed messages (conv 3: David Patel - unread)
insert into public.messages (conversation_id, sender_id, sender_role, body, read_at, created_at) values
  ('b0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000024', 'caregiver', 'Hi, this is David. Mom''s been asking about transportation to appointments.', now() - interval '1 day', now() - interval '1 day'),
  ('b0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 'navigator', 'We have a few options I can walk you through.', now() - interval '1 day', now() - interval '1 day'),
  ('b0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000024', 'caregiver', 'Can we schedule a check-in call this week?', null, now() - interval '30 minutes');

update public.conversations set unread_count = 1 where id = 'b0000001-0000-4000-8000-000000000003';
