-- Migration: Create knowledge_golden_qa table & RPC for Golden Verified Q&A Layer (Rated 8-10)

create table if not exists public.knowledge_golden_qa (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  cleaned_question text not null,
  embedding extensions.vector(768) not null,
  golden_answer text not null,
  rating_score integer not null check (rating_score >= 1 and rating_score <= 10),
  verified_by text default 'agent',
  comment text,
  sources jsonb not null default '[]'::jsonb,
  usage_count integer not null default 0 check (usage_count >= 0),
  last_used_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_knowledge_golden_qa_rating
  on public.knowledge_golden_qa(rating_score desc);

create index if not exists idx_knowledge_golden_qa_created_at
  on public.knowledge_golden_qa(created_at desc);

create index if not exists idx_knowledge_golden_qa_usage_count
  on public.knowledge_golden_qa(usage_count desc);

-- Create RPC to lookup matching golden answer with similarity threshold >= 0.88
create or replace function public.match_golden_qa(
  query_embedding extensions.vector(768),
  similarity_threshold double precision default 0.88
)
returns table (
  id uuid,
  question text,
  golden_answer text,
  rating_score integer,
  verified_by text,
  comment text,
  sources jsonb,
  usage_count integer,
  similarity double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    gqa.id,
    gqa.question,
    gqa.golden_answer,
    gqa.rating_score,
    gqa.verified_by,
    gqa.comment,
    gqa.sources,
    gqa.usage_count,
    1 - (gqa.embedding <=> query_embedding) as similarity
  from public.knowledge_golden_qa gqa
  where (1 - (gqa.embedding <=> query_embedding)) >= similarity_threshold
  order by (1 - (gqa.embedding <=> query_embedding)) desc
  limit 1;
$$;

alter table public.knowledge_golden_qa enable row level security;

drop policy if exists "Service role manages knowledge_golden_qa" on public.knowledge_golden_qa;
create policy "Service role manages knowledge_golden_qa"
  on public.knowledge_golden_qa for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
