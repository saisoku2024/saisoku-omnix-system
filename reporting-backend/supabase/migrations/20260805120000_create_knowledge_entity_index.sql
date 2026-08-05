-- Entity/topic index for Knowledge Base lookup queries.

create table if not exists public.knowledge_entities (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  chunk_id uuid references public.knowledge_chunks(id) on delete cascade,
  entity_type text not null
    check (entity_type in ('brand', 'series', 'model', 'product_code', 'topic', 'document_type')),
  entity_value text not null,
  normalized_value text not null,
  confidence numeric not null default 1.0 check (confidence >= 0 and confidence <= 1),
  source text not null default 'regex',
  created_at timestamptz not null default now(),
  unique (document_id, chunk_id, entity_type, normalized_value)
);

alter table public.knowledge_documents
  add column if not exists entity_indexed_at timestamptz,
  add column if not exists entity_index_version text;

create index if not exists idx_knowledge_entities_normalized
  on public.knowledge_entities(normalized_value);

create index if not exists idx_knowledge_entities_type_normalized
  on public.knowledge_entities(entity_type, normalized_value);

create index if not exists idx_knowledge_entities_document
  on public.knowledge_entities(document_id);

alter table public.knowledge_entities enable row level security;

drop policy if exists "Service role manages knowledge_entities" on public.knowledge_entities;
create policy "Service role manages knowledge_entities"
  on public.knowledge_entities for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
