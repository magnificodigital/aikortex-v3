-- ── Leads (CRM) ──────────────────────────────────────────────────────────
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  agent_id      uuid references public.user_agents(id) on delete set null,
  name          text not null default '',
  email         text not null default '',
  phone         text not null default '',
  company       text not null default '',
  position      text not null default '',
  stage         text not null default 'lead'
                check (stage in ('lead','em_atendimento','qualificado','agendado','negociacao','ganho','perdido')),
  source        text not null default 'manual'
                check (source in ('linkedin','google_maps','whatsapp','instagram','website','indicacao','manual')),
  temperature   text not null default 'morno'
                check (temperature in ('frio','morno','quente')),
  value         numeric not null default 0,
  assignee      text not null default '',
  tags          text[] not null default '{}',
  notes         text not null default '',
  activities    jsonb not null default '[]',
  lost_reason   text,
  channel       text default 'chat',  -- which channel the lead came from
  contact_id    text,                 -- external contact identifier (phone, instagram id, etc.)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- RLS
alter table public.leads enable row level security;

create policy "users_own_leads" on public.leads
  for all using (auth.uid() = user_id);

-- Index for fast CRM loads
create index leads_user_id_idx on public.leads(user_id);
create index leads_agent_id_idx on public.leads(agent_id);
create index leads_stage_idx   on public.leads(stage);

-- ── Conversations ─────────────────────────────────────────────────────────
-- Stores conversation history per contact per agent (for memory)
create table if not exists public.conversations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  agent_id       uuid references public.user_agents(id) on delete cascade,
  contact_id     text not null,   -- phone number, email, or session id
  channel        text not null default 'chat',
  messages       jsonb not null default '[]',
  lead_id        uuid references public.leads(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(agent_id, contact_id, channel)
);

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;

create policy "users_own_conversations" on public.conversations
  for all using (auth.uid() = user_id);

create index conversations_agent_contact_idx on public.conversations(agent_id, contact_id);

-- ── Tool credentials (per user, encrypted at rest by Supabase Vault) ──────
create table if not exists public.tool_credentials (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tool        text not null,   -- 'google_calendar' | 'hubspot' | 'pipedrive' | ...
  credentials jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, tool)
);

create trigger tool_credentials_updated_at
  before update on public.tool_credentials
  for each row execute function public.set_updated_at();

alter table public.tool_credentials enable row level security;

create policy "users_own_tool_credentials" on public.tool_credentials
  for all using (auth.uid() = user_id);
