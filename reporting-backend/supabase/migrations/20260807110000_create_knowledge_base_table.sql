-- SQL Migration: 20260807110000_create_knowledge_base_table.sql
-- Description: Create & enhance knowledge base tables, categories, tags, and indexing for fast search and pagination.

-- 1. Ensure knowledge_documents table has category and tags columns
ALTER TABLE public.knowledge_documents
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General FAQ',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'system@omnix.com';

-- 2. Add Constraint for Category standard values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_knowledge_documents_category'
    ) THEN
        ALTER TABLE public.knowledge_documents 
        ADD CONSTRAINT check_knowledge_documents_category 
        CHECK (category IS NULL OR category IN ('Product Info', 'SOP System', 'Promo & Rules', 'General FAQ', 'Operational'));
    END IF;
END $$;

-- 3. Create Indexes for Search, Category Filtering, and Fast Pagination
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON public.knowledge_documents(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_tags ON public.knowledge_documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status_created ON public.knowledge_documents(status, created_at DESC);

-- 4. Create View for Legacy/Alias compatibility if needed
CREATE OR REPLACE VIEW public.v_knowledge_base AS
SELECT 
    kd.id,
    kd.title,
    COALESCE(kd.category, 'General FAQ') AS category,
    COALESCE(kd.tags, '{}'::text[]) AS tags,
    kd.source_file,
    kd.source_type,
    kd.status,
    kd.chunk_count,
    kd.content,
    kd.created_by AS author,
    kd.error_summary,
    kd.created_at,
    kd.updated_at
FROM public.knowledge_documents kd;

-- Grants for service role
GRANT ALL ON public.v_knowledge_base TO service_role;
