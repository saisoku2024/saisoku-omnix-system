-- Migration: Add metadata, temporal validity, trust level, and embedding model lock columns to knowledge_documents
ALTER TABLE public.knowledge_documents
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'file',
ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'official',
ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS effective_until TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'gemini-embedding-001',
ADD COLUMN IF NOT EXISTS needs_reindex BOOLEAN DEFAULT FALSE;

-- Add index on effective_until and needs_reindex for fast filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_effective ON public.knowledge_documents(effective_until);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_reindex ON public.knowledge_documents(needs_reindex);
