-- Migration: Create dedicated knowledge_query_logs table for RAG evaluation & monitoring

create table if not exists public.knowledge_query_logs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  cleaned_question text,
  retrieval_method text not null default 'unknown'
    check (retrieval_method in ('vector', 'keyword', 'entity_index', 'hybrid', 'unknown')),
  matched_chunk_ids uuid[] not null default '{}',
  source_count integer not null default 0 check (source_count >= 0),
  top_similarity double precision,
  is_answered boolean not null default true,
  embedding_latency_ms integer,
  retrieval_latency_ms integer,
  generation_latency_ms integer,
  total_latency_ms integer,
  chat_model text,
  created_at timestamptz not null default now()
);

create index if not exists idx_knowledge_query_logs_created_at
  on public.knowledge_query_logs(created_at desc);

create index if not exists idx_knowledge_query_logs_is_answered
  on public.knowledge_query_logs(is_answered);

alter table public.knowledge_query_logs enable row level security;

drop policy if exists "Service role manages knowledge_query_logs" on public.knowledge_query_logs;
create policy "Service role manages knowledge_query_logs"
  on public.knowledge_query_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
