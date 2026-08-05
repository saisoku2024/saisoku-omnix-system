-- Ensure Knowledge Base retrieval only uses active, trusted, and current documents.

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
    and coalesce(kd.needs_reindex, false) = false
    and (kd.effective_until is null or kd.effective_until > now())
  order by
    case lower(coalesce(kd.trust_level, 'internal'))
      when 'official' then 50
      when 'verified' then 40
      when 'internal' then 30
      when 'draft' then 10
      when 'deprecated' then 0
      else 30
    end desc,
    kc.embedding <=> query_embedding
  limit greatest(1, least(coalesce(match_count, 6), 12));
$$;
