-- AI Knowledge Base storage and vector search.

create extension if not exists vector with schema extensions;

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_file text,
  mime_type text,
  status text not null default 'ready'
    check (status in ('processing', 'ready', 'failed')),
  chunk_count integer not null default 0 check (chunk_count >= 0),
  created_by text not null default 'system@omnix.com',
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  title text not null,
  content text not null,
  token_estimate integer not null default 0 check (token_estimate >= 0),
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists idx_knowledge_documents_created_at
  on public.knowledge_documents(created_at desc);

create index if not exists idx_knowledge_chunks_document_id
  on public.knowledge_chunks(document_id);

create index if not exists idx_knowledge_chunks_embedding
  on public.knowledge_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

drop trigger if exists set_knowledge_documents_updated_at on public.knowledge_documents;
create trigger set_knowledge_documents_updated_at
before update on public.knowledge_documents
for each row execute function public.set_updated_at();

alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;

drop policy if exists "Service role manages knowledge_documents" on public.knowledge_documents;
create policy "Service role manages knowledge_documents"
  on public.knowledge_documents for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages knowledge_chunks" on public.knowledge_chunks;
create policy "Service role manages knowledge_chunks"
  on public.knowledge_chunks for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(768),
  match_count int default 6
)
returns table (
  chunk_id uuid,
  document_id uuid,
  title text,
  content text,
  chunk_index integer,
  similarity double precision
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
    kc.chunk_index,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  join public.knowledge_documents kd on kd.id = kc.document_id
  where kd.status = 'ready'
  order by kc.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 6), 12));
$$;
