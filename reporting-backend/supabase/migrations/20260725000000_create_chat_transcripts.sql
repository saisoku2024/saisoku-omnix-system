-- Migration to create chat_transcripts table for 360-degree AI conversational analysis.

create table if not exists public.chat_transcripts (
  id uuid primary key default gen_random_uuid(),
  id_interaction text,
  session_id text not null,
  channel_name text,
  from_id text,
  from_username text,
  from_name text,
  agent_name text,
  action_type text, -- 'IN' (Customer) or 'OUT' (Agent)
  subject text,
  message text not null,
  date_origin timestamptz,
  date_received timestamptz,
  response_time_sec int default 0,
  
  -- Smart Tagging
  detected_brand text default 'Other',   -- 'Tineco', 'Ecovacs', 'Laifen', 'Tymo', 'Yoniev', 'Other'
  detected_partner text default 'General', -- 'Unicom', 'Mitracare', 'Plaza Segi 8', 'PRJ', 'Tokopedia', 'Shopee', 'General'
  
  deleted_at timestamptz default null,
  created_at timestamptz default now()
);

-- Indexes for fast analytics queries
create index if not exists idx_chat_transcripts_session_id on public.chat_transcripts(session_id);
create index if not exists idx_chat_transcripts_brand on public.chat_transcripts(detected_brand);
create index if not exists idx_chat_transcripts_partner on public.chat_transcripts(detected_partner);
create index if not exists idx_chat_transcripts_date_origin on public.chat_transcripts(date_origin);
create index if not exists idx_chat_transcripts_deleted_at on public.chat_transcripts(deleted_at);
