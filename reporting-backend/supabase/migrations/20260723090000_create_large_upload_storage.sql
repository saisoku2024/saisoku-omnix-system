-- Private buckets for direct browser uploads up to 50MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'knowledge-files',
    'knowledge-files',
    false,
    52428800,
    array[
      'application/pdf',
      'application/octet-stream',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
      'text/csv'
    ]
  ),
  (
    'data-uploads',
    'data-uploads',
    false,
    52428800,
    array[
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.knowledge_documents
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists file_size bigint;

create index if not exists idx_knowledge_documents_storage_path
  on public.knowledge_documents(storage_bucket, storage_path);
