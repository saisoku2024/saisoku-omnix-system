alter table public.csat_responses add column if not exists deleted_at timestamptz;
alter table public.csat_responses add column if not exists deleted_reason text;
alter table public.csat_responses add column if not exists deleted_by text;
alter table public.csat_responses add column if not exists cleanup_batch_id uuid;

create index if not exists idx_csat_responses_deleted_at on public.csat_responses(deleted_at);

notify pgrst, 'reload schema';
