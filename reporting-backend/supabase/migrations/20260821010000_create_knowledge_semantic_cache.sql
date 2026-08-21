-- Migration: Create knowledge_semantic_cache table & RPC for Semantic Query Caching (TTL 365 Days)

create table if not exists public.knowledge_semantic_cache (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  cleaned_question text not null,
  embedding extensions.vector(768) not null,
  answer text not null,
  sources jsonb not null default '[]'::jsonb,
  hit_count integer not null default 1 check (hit_count >= 1),
  expires_at timestamptz not null default (now() + interval '365 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_semantic_cache_expires_at
  on public.knowledge_semantic_cache(expires_at);

create index if not exists idx_knowledge_semantic_cache_created_at
  on public.knowledge_semantic_cache(created_at desc);

-- Create RPC to lookup matching semantic query with similarity threshold >= 0.96
create or replace function public.match_semantic_cache(
  query_embedding extensions.vector(768),
  similarity_threshold double precision default 0.96
)
returns table (
  cache_id uuid,
  question text,
  answer text,
  sources jsonb,
  hit_count integer,
  similarity double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    sc.id as cache_id,
    sc.question,
    sc.answer,
    sc.sources,
    sc.hit_count,
    1 - (sc.embedding <=> query_embedding) as similarity
  from public.knowledge_semantic_cache sc
  where sc.expires_at > now()
    and (1 - (sc.embedding <=> query_embedding)) >= similarity_threshold
  order by (1 - (sc.embedding <=> query_embedding)) desc
  limit 1;
$$;

alter table public.knowledge_semantic_cache enable row level security;

drop policy if exists "Service role manages knowledge_semantic_cache" on public.knowledge_semantic_cache;
create policy "Service role manages knowledge_semantic_cache"
  on public.knowledge_semantic_cache for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
