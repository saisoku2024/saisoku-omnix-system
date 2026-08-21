-- Migration: Add Full-Text Search (FTS) to knowledge_chunks & User Feedback to knowledge_query_logs

-- 1. Add FTS generated tsvector column & GIN index on knowledge_chunks
alter table public.knowledge_chunks 
  add column if not exists fts tsvector 
  generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))) stored;

create index if not exists idx_knowledge_chunks_fts 
  on public.knowledge_chunks using gin(fts);

-- 2. Create FTS Search RPC function for fast BM25/keyword ranking
create or replace function public.search_knowledge_chunks_fts(
  query_text text,
  match_count int default 12
)
returns table (
  chunk_id uuid,
  document_id uuid,
  title text,
  content text,
  context_prefix text,
  chunk_index integer,
  rank real
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    kc.id as chunk_id,
    kc.document_id,
    kc.title,
    kc.content,
    kc.context_prefix,
    kc.chunk_index,
    ts_rank_cd(kc.fts, plainto_tsquery('simple', query_text)) as rank
  from public.knowledge_chunks kc
  join public.knowledge_documents kd on kd.id = kc.document_id
  where kd.status = 'ready'
    and coalesce(kd.needs_reindex, false) = false
    and (kd.effective_until is null or kd.effective_until > now())
    and kc.fts @@ plainto_tsquery('simple', query_text)
  order by rank desc
  limit greatest(1, least(coalesce(match_count, 12), 30));
$$;

-- 3. Add Feedback columns to knowledge_query_logs
alter table public.knowledge_query_logs
  add column if not exists feedback_score smallint check (feedback_score in (-1, 1)),
  add column if not exists feedback_comment text,
  add column if not exists feedback_at timestamptz;

create index if not exists idx_knowledge_query_logs_feedback
  on public.knowledge_query_logs(feedback_score)
  where feedback_score is not null;
